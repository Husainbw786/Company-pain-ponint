import { useState } from 'react';
import { Search, Globe, Building, Bot, Key, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import './index.css';

function App() {
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_OPENAI_API_KEY || '');
  const [companyName, setCompanyName] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { content: string, reasoning: string | null }
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!apiKey) {
      setError('API Key not found in environment.');
      return;
    }
    if (!companyName && !companyUrl) {
      setError('Please provide a company name or URL.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const isUrlProvided = !!companyUrl;
    let messages = [];
    let tools = [];

    // Define tools and messages based on input
    if (isUrlProvided) {
      let domain = companyUrl;
      try {
        const urlObj = new URL(companyUrl);
        domain = urlObj.hostname;
      } catch (e) {
        domain = companyUrl;
      }

      tools = [{
        type: 'web_search',
        filters: { allowed_domains: [domain] }
      }];
      messages = [
        {
          role: "developer",
          content: "You are a helpful assistant. Search the provided url and give me the company pain points. Format your response in clean Markdown with headers and bullet points."
        },
        {
          role: "user",
          content: `Find pain points for ${companyUrl}`
        }
      ];
    } else {
      tools = [{ type: 'web_search' }];
      messages = [
        {
          role: "developer",
          content: "You are a helpful assistant. Do web search and give me the company pain points. Format your response in clean Markdown with headers and bullet points."
        },
        {
          role: "user",
          content: `Find pain points for company: ${companyName}`
        }
      ];
    }

    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-5-nano',
          tools: tools,
          input: messages
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || response.statusText);
      }

      const data = await response.json();

      // Parse the response based on the user provided structure
      let content = "";
      let reasoning = null;

      if (data.output && Array.isArray(data.output)) {
        // Handle custom output structure
        data.output.forEach(item => {
          if (item.type === 'message' && item.content) {
            // Sometimes content is an array of text objects
            if (Array.isArray(item.content)) {
              item.content.forEach(part => {
                if (part.type === 'output_text') {
                  content += part.text;
                }
              });
            } else if (typeof item.content === 'string') {
              content += item.content;
            }
          }
          if (item.type === 'reasoning') {
            // Store reasoning if needed, though structure varies
            reasoning = item.summary; // customized based on prompt
          }
        });
      } else if (data.choices && data.choices[0] && data.choices[0].message) {
        // Standard OpenAI format fallback
        content = data.choices[0].message.content;
      } else if (data.output_text) {
        content = data.output_text;
      } else {
        // Fallback: dump everything if we can't parse
        content = "Could not parse standard response format. Raw Output:\n```json\n" + JSON.stringify(data, null, 2) + "\n```";
      }

      setResult({ content, reasoning });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card"
      >
        <div className="header-section">
          <div className="icon-container">
            <Bot size={32} color="#a78bfa" />
          </div>
          <div>
            <h1 className="main-title">
              Pain Points Finder
            </h1>
            <p className="subtitle">
              Deep dive into company challenges with AI
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <div className="input-group">
            <label className="label-text">
              <Building size={14} className="input-icon" />
              Company Name (If no URL)
            </label>
            <input
              type="text"
              className="glass-input"
              placeholder="e.g. Tesla, Apple"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={!!companyUrl || loading}
            />
          </div>

          <div className="divider">OR</div>

          <div className="input-group">
            <label className="label-text">
              <Globe size={14} className="input-icon" />
              Company URL
            </label>
            <input
              type="text"
              className="glass-input"
              placeholder="e.g. https://tesla.com"
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              disabled={!!companyName || loading}
            />
          </div>

          <button type="submit" className="glow-button" disabled={loading}>
            {loading ? (
              <span className="button-content">
                <span className="spinner"></span> Analyzing...
              </span>
            ) : (
              <span className="button-content">
                <Sparkles size={18} /> Find Pain Points
              </span>
            )}
          </button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="error-message"
            >
              <AlertCircle size={18} /> {error}
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="result-container"
            >
              <h3 className="result-title">Analysis Results</h3>
              <div className="markdown-content">
                <ReactMarkdown>{result.content}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="footer-credit">
        Agentic Scraper v1.0
      </div>
    </div>
  );
}

export default App;
