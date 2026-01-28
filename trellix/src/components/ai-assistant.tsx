import { useState, useRef, useEffect } from 'react';
import { base44 } from '../sdk-client/base44-client';
import Icon from './sidebar/icon';
import type { User } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>');
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onDataChange: () => void;
}

export default function AIAssistant({ isOpen, onClose, user, onDataChange }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !loading) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    const tempUserMsg: Message = { id: Date.now().toString(), role: 'user', content: userMessage };
    setMessages((prev) => [...prev, tempUserMsg]);

    let conv = conversation;
    if (!conv) {
      conv = await base44.agents.createConversation({
        agent_name: 'assistant',
        metadata: {
          user_email: user.email,
          user_name: user.full_name || user.email,
        },
      });
      setConversation(conv);
    }

    const response = await base44.agents.addMessage(conv, {
      role: 'user',
      content: userMessage,
      custom_context: [{
        type: 'user_info',
        message: `Current user: ${user.full_name || 'Unknown'} (${user.email})`,
        data: { email: user.email, name: user.full_name },
      }],
    });
    
    setMessages((prev) => [
      ...prev.filter((m) => m.id !== tempUserMsg.id),
      { id: response.id || Date.now().toString(), role: 'user', content: userMessage },
    ]);

    const updated = await base44.agents.getConversation(conv.id);
    if (updated) {
      const assistantMsgs = updated.messages.filter((m) => m.role === 'assistant');
      const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
      if (lastAssistant) {
        setMessages((prev) => [...prev, { id: lastAssistant.id, role: 'assistant', content: lastAssistant.content as string }]);
        // Refresh app data in case AI created/updated boards or tasks
        onDataChange();
      }
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-assistant-overlay" onClick={onClose}>
      <div className="ai-assistant" onClick={(e) => e.stopPropagation()}>
        <div className="ai-header">
          <div className="ai-title">
            <Icon name="trix" size={28} />
            <span>Trix</span>
          </div>
          <button className="ai-close" onClick={onClose}>
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="ai-messages">
          {messages.length === 0 && (
            <div className="ai-empty">
              <Icon name="trix" size={64} />
              <h3>Hey{user.full_name ? ` ${user.full_name.split(' ')[0]}` : ''}, I'm Trix!</h3>
              <p>Your friendly sidekick for boards and tasks. Ask me anything!</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`ai-message ${msg.role}`}>
              <div
                className="ai-message-content"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
              />
            </div>
          ))}
          {loading && (
            <div className="ai-message assistant">
              <div className="ai-message-content ai-typing">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-input-form">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
          />
          <button type="button" onClick={sendMessage} disabled={loading || !input.trim()}>
            <Icon name="send" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
