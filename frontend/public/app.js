(function(){
  const e = React.createElement;
  function App(){
    const [user, setUser] = React.useState({ uid: 'dev-uid', email: 'dev@example.com' });
    const [status, setStatus] = React.useState('');
    const [attendance, setAttendance] = React.useState([]);

    async function checkIn(){
      setStatus('Checking in...');
      const date = new Date().toISOString().slice(0,10);
      const checkInTime = new Date().toISOString();
      let coords = { lat: 0, lng: 0 };
      if (navigator.geolocation) {
        try {
          const p = await new Promise((res, rej)=> navigator.geolocation.getCurrentPosition(res, rej));
          coords = { lat: p.coords.latitude, lng: p.coords.longitude };
        } catch(e) {
          // ignore
        }
      }
      try {
        const resp = await fetch('/api/attendance/checkin', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ date, checkInTime, coords })
        });
        const j = await resp.json();
        if (resp.ok) setStatus('Checked in successfully'); else setStatus('Check-in failed: '+(j.error||JSON.stringify(j)));
        loadAttendance();
      } catch (err) { setStatus('Network error'); }
    }

    async function checkOut(){
      setStatus('Checking out...');
      const date = new Date().toISOString().slice(0,10);
      const checkOutTime = new Date().toISOString();
      try {
        const resp = await fetch('/api/attendance/checkout', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ date, checkOutTime })
        });
        const j = await resp.json();
        if (resp.ok) setStatus('Checked out successfully'); else setStatus('Check-out failed: '+(j.error||JSON.stringify(j)));
        loadAttendance();
      } catch (err) { setStatus('Network error'); }
    }

    async function loadAttendance(){
      setStatus('Loading attendance...');
      try {
        const resp = await fetch('/api/attendance/list/'+encodeURIComponent(user.uid));
        const j = await resp.json();
        if (resp.ok) { setAttendance(j.items||[]); setStatus('Loaded'); } else setStatus('Failed: '+(j.error||JSON.stringify(j)));
      } catch (err) { setStatus('Network error'); }
    }

    React.useEffect(()=>{ loadAttendance(); }, []);

    return e('div', {style:{fontFamily:'Arial, sans-serif', padding:20, maxWidth:800}},
      e('h2', null, 'EMS Frontend — Quick Demo'),
      e('div', null, 'Signed in as: ', e('strong', null, user.email)),
      e('div', {style:{marginTop:10}},
        e('button', {onClick: checkIn, style:{marginRight:8}}, 'Check In'),
        e('button', {onClick: checkOut}, 'Check Out'),
        e('button', {onClick: loadAttendance, style:{marginLeft:12}}, 'Refresh')
      ),
      e('div', {style:{marginTop:12}}, e('em', null, status)),
      e('h3', {style:{marginTop:20}}, 'Attendance Records'),
      e('table', {style:{width:'100%', borderCollapse:'collapse'}},
        e('thead', null, e('tr', null,
          e('th', {style:{border:'1px solid #ddd', padding:8}}, 'Date'),
          e('th', {style:{border:'1px solid #ddd', padding:8}}, 'Check In'),
          e('th', {style:{border:'1px solid #ddd', padding:8}}, 'Check Out'),
          e('th', {style:{border:'1px solid #ddd', padding:8}}, 'Location')
        )),
        e('tbody', null, attendance.length===0 ? e('tr', null, e('td',{colSpan:4, style:{padding:8}}, 'No records')) : attendance.map((a)=>(
          e('tr', {key: a.id},
            e('td', {style:{border:'1px solid #ddd', padding:8}}, a.date || '-'),
            e('td', {style:{border:'1px solid #ddd', padding:8}}, a.checkIn || '-'),
            e('td', {style:{border:'1px solid #ddd', padding:8}}, a.checkOut || '-'),
            e('td', {style:{border:'1px solid #ddd', padding:8}}, a.location ? (a.location.lat+','+a.location.lng) : '-')
          )
        )))
      )
    );
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(e(App));
})();
