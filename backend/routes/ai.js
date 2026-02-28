const express = require('express');
const router = express.Router();
const authJwt = require('../middleware/authJwt');
const { getDb } = require('../dbProvider');

// Mock AI response for development (replace with OpenAI API in production)
const mockAIResponse = async (task_type, prompt, tone) => {
  const responses = {
    email: `Subject: ${prompt.substring(0, 50)}

Dear Hiring Manager,

${prompt}

This email has been generated with a ${tone || 'professional'} tone.

Please feel free to modify as needed.

Best regards,
HR Department`,

    employment_law: `Based on your query about Indian employment laws:

${prompt}

**Important Legal Disclaimer:**
This information is for general guidance under Indian employment laws and should not be treated as formal legal advice. For specific legal matters, please consult a qualified legal professional.

Key points to consider:
- The Industrial Disputes Act, 1947
- The Employees' State Insurance Act, 1948
- The Factories Act, 1948
- The Payment of Wages Act, 1936

For detailed information, please refer to the Ministry of Labour and Employment website.`,

    hr_query: `HR Policy Guidance:

${prompt}

This response is generated based on standard HR practices in Indian companies.

Note: Company-specific policies may vary. Please consult your organization's HR department for specific policies.

Standard practices include:
- Employee onboarding procedures
- Leave management policies
- Performance evaluation frameworks
- Grievance handling mechanisms`
  };

  return responses[task_type] || responses.hr_query;
};

// Main AI Processing Endpoint
router.post('/process', authJwt, async (req, res) => {
  try {
    const { task_type, prompt, tone, context } = req.body;

    if (!task_type || !prompt) {
      return res.status(400).json({ error: 'task_type and prompt are required' });
    }

    // Validate task_type
    const validTypes = ['email', 'employment_law', 'hr_query'];
    if (!validTypes.includes(task_type)) {
      return res.status(400).json({ 
        error: 'Invalid task_type. Must be one of: email, employment_law, hr_query' 
      });
    }

    // Determine system prompt based on task type
    let systemPrompt = '';
    if (task_type === 'email') {
      systemPrompt = 'You are a professional corporate email drafting assistant.';
    } else if (task_type === 'employment_law') {
      systemPrompt = 'You are an expert in Indian employment laws.';
    } else if (task_type === 'hr_query') {
      systemPrompt = 'You are a senior HR consultant for Indian companies.';
    }

    // Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    let aiResponse;
    let tokensUsed = 0;

    if (openaiApiKey) {
      // Use OpenAI API
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: openaiApiKey });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: tone === 'strict' ? 0.2 : tone === 'professional' ? 0.5 : 0.7
      });

      aiResponse = completion.choices[0].message.content;
      tokensUsed = completion.usage.total_tokens;
    } else {
      // Use mock response for development
      aiResponse = await mockAIResponse(task_type, prompt, tone);
      tokensUsed = Math.floor(prompt.length / 4); // Approximate token count
    }

    // Add legal disclaimer for employment law queries
    if (task_type === 'employment_law') {
      aiResponse += `\n\n**Disclaimer:** This information is for general guidance under Indian employment laws and should not be treated as formal legal advice.`;
    }

    res.json({
      status: 'success',
      task_type,
      response: aiResponse,
      tokens_used: tokensUsed,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('AI process error:', err);
    res.status(500).json({ error: 'Failed to process AI request' });
  }
});

// Specialized endpoint for email drafting
router.post('/email', authJwt, async (req, res) => {
  try {
    const { subject, purpose, tone, recipient_type } = req.body;

    if (!subject || !purpose) {
      return res.status(400).json({ error: 'subject and purpose are required' });
    }

    const prompt = `Write a ${tone || 'formal'} email to a ${recipient_type || 'recipient'}. Subject: ${subject}. Purpose: ${purpose}`;

    // Use mock for now
    const response = `Subject: ${subject}

Dear ${recipient_type || 'Sir/Madam'},

${purpose}

Please let me know if you need any additional information.

Best regards,
HR Department`;

    res.json({
      status: 'success',
      task_type: 'email',
      response,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('AI email error:', err);
    res.status(500).json({ error: 'Failed to generate email' });
  }
});

// Specialized endpoint for employment law queries
router.post('/employment-law', authJwt, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    // Mock response for Indian employment law
    const response = `Regarding your query about Indian employment laws:

${query}

**Key Indian Labor Laws to Reference:**

1. **Industrial Disputes Act, 1947** - Covers dispute resolution, layoffs, and closures
2. **Employees' State Insurance Act, 1948** - Medical benefits and insurance
3. **The Factories Act, 1948** - Health, safety, and welfare of workers
4. **Payment of Wages Act, 1936** - Wage payment regulations
5. **Maternity Benefit Act, 1961** - Maternity leave and benefits
6. **Employee Provident Fund Act, 1952** - Retirement benefits

**Important Disclaimer:**
This information is for general guidance and should not be treated as formal legal advice. Please consult a qualified legal professional for specific legal matters.`;

    res.json({
      status: 'success',
      task_type: 'employment_law',
      response,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('AI employment law error:', err);
    res.status(500).json({ error: 'Failed to process employment law query' });
  }
});

// Specialized endpoint for HR policy queries
router.post('/hr', authJwt, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const response = `HR Policy Guidance:

${query}

**Standard HR Practices in Indian Companies:**

- **Notice Period:** Typically 1-3 months depending on role and company policy
- **Leave Policies:** Annual leaves (15-20 days), Sick leaves (10-15 days), Casual leaves (5-7 days)
- **Probation Period:** Usually 3-6 months
- **Gratuity:** Applicable after 5 years of continuous service
- **EPF:** 12% contribution from both employer and employee

**Note:** Specific policies vary by organization. Please refer to your company's employee handbook for detailed information.`;

    res.json({
      status: 'success',
      task_type: 'hr_query',
      response,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('AI HR query error:', err);
    res.status(500).json({ error: 'Failed to process HR query' });
  }
});

module.exports = router;


