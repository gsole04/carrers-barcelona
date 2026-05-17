import { useState, useRef } from "react";

const SYSTEM_PROMPT = `Ets un expert absolut en la geografia dels carrers de Barcelona. El teu paper és ser el "game master" d'un joc de coneixement dels carrers de Barcelona per a un jugador adult que coneix bé la ciutat.

El joc funciona així:
1. Generes un punt de partida (una cruïlla real i existent de Barcelona) i una instrucció de moviment clara
2. El jugador respon quin carrer o cruïlla troba
3. Valides la resposta i continues el joc des de la nova posició

REGLES IMPORTANTS:
- Usa NOMÉS carrers i cruïlles que realment existeixen a Barcelona
- Les instruccions poden ser: "Puges per X", "Baixes per X", "Gires a l'esquerra/dreta per X", "Travesses N carrers", etc.
- Accepta respostes aproximades o variants del nom (p.ex. "Gran Via" per "Gran Via de les Corts Catalanes", "Diagonal" per "Avinguda Diagonal")
- Cobreix diferents barris: Eixample, Gràcia, Sants, Sant Martí, Horta, Sarrià, Poble Sec, etc.
- Varia la dificultat: de vegades carrers molt coneguts, de vegades més desconeguts
- La instrucció ha de tenir una resposta única i clara
- Quan el jugador s'equivoca, explica breument per on passa el carrer correcte

SEMPRE respon únicament en format JSON vàlid amb aquesta estructura exacta (sense cap text addicional, sense blocs de codi):
{
  "location": "Nom de la cruïlla actual on es troba el jugador",
  "instruction": "La instrucció de moviment per al jugador (frase completa)",
  "feedback": null,
  "correct": null,
  "correct_answer": null,
  "score_delta": 0
}

Per a respostes del jugador, usa aquesta estructura:
{
  "location": "Nova cruïlla on ha arribat el jugador",
  "instruction": "Nova instrucció des de la nova posició",
  "feedback": "Comentari sobre la resposta anterior (breu i amable)",
  "correct": true o false,
  "correct_answer": null si era correcta, o "la resposta correcta" si era incorrecta,
  "score_delta": 1 si correcta, 0 si incorrecta
}`;

export default function BarcelonaCarrers() {
  const [gameState, setGameState] = useState("start");
  const [messages, setMessages] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const callClaude = async (msgs) => {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: msgs,
      }),
    });
    const data = await response.json();
    const text = data.content.map(i => i.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  };

  const startGame = async () => {
    setGameState("loading");
    setError(null);
    try {
      const initMsg = [{ role: "user", content: "Comença el joc! Genera la primera cruïlla i instrucció. Escull un punt de partida interessant de Barcelona." }];
      const result = await callClaude(initMsg);
      setMessages([...initMsg, { role: "assistant", content: JSON.stringify(result) }]);
      setCurrentData(result);
      setScore(0);
      setQuestionCount(0);
      setFeedback(null);
      setGameState("playing");
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (e) {
      setError("Error de connexió. Torna-ho a provar.");
      setGameState("start");
    }
  };

  const submitAnswer = async () => {
    if (!userInput.trim() || gameState === "loading") return;
    const answer = userInput.trim();
    setUserInput("");
    setGameState("loading");

    try {
      const newMessages = [
        ...messages,
        { role: "user", content: `La meva resposta és: "${answer}"` }
      ];
      const result = await callClaude(newMessages);
      setMessages([...newMessages, { role: "assistant", content: JSON.stringify(result) }]);
      setFeedback({ correct: result.correct, text: result.feedback, correct_answer: result.correct_answer });
      setScore(s => s + (result.score_delta || 0));
      setQuestionCount(q => q + 1);
      setCurrentData(result);
      setGameState("playing");
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (e) {
      setError("Error en processar la resposta.");
      setGameState("playing");
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") submitAnswer();
  };

  const accuracy = questionCount > 0 ? Math.round((score / questionCount) * 100) : 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d1117",
      backgroundImage: `
        radial-gradient(ellipse at 20% 50%, rgba(255,180,0,0.04) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(255,120,0,0.03) 0%, transparent 40%),
        linear-gradient(rgba(255,180,0,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,180,0,0.025) 1px, transparent 1px)
      `,
      backgroundSize: "100% 100%, 100% 100%, 32px 32px, 32px 32px",
      fontFamily: "'IBM Plex Mono', monospace",
      color: "#dcc98a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "24px 16px 40px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        
        * { box-sizing: border-box; }

        .card {
          border: 1px solid rgba(220,180,80,0.18);
          background: rgba(255,180,0,0.025);
          position: relative;
        }
        .card::before, .card::after {
          content: '';
          position: absolute;
          width: 12px; height: 12px;
          border-color: rgba(220,180,80,0.5);
          border-style: solid;
        }
        .card::before { top: -1px; left: -1px; border-width: 1px 0 0 1px; }
        .card::after { bottom: -1px; right: -1px; border-width: 0 1px 1px 0; }

        .answer-input {
          flex: 1;
          background: rgba(220,180,80,0.06);
          border: 1px solid rgba(220,180,80,0.25);
          color: #ffd060;
          padding: 12px 14px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          border-radius: 2px;
          min-width: 0;
        }
        .answer-input:focus {
          border-color: rgba(220,180,80,0.6);
          box-shadow: 0 0 0 3px rgba(220,180,80,0.08);
        }
        .answer-input::placeholder { color: rgba(220,180,80,0.2); }

        .btn {
          background: #d4a017;
          color: #0d1117;
          border: none;
          padding: 12px 20px;
          font-family: 'IBM Plex Mono', monospace;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          border-radius: 2px;
          white-space: nowrap;
        }
        .btn:hover:not(:disabled) { background: #f0b820; transform: translateY(-1px); }
        .btn:active:not(:disabled) { transform: translateY(0); }
        .btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .btn-ghost {
          background: transparent;
          border: 1px solid rgba(220,180,80,0.25);
          color: rgba(220,180,80,0.5);
          padding: 8px 16px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          cursor: pointer;
          letter-spacing: 0.15em;
          transition: all 0.2s;
          border-radius: 2px;
        }
        .btn-ghost:hover { border-color: rgba(220,180,80,0.5); color: rgba(220,180,80,0.8); }

        .fade-in { animation: fadeIn 0.35s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

        .blink { animation: blink 1.2s step-end infinite; }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

        .loading-dots::after {
          content: '...';
          animation: dots 1.2s steps(4, end) infinite;
        }
        @keyframes dots {
          0%  { content: '.'; }
          33% { content: '..'; }
          66% { content: '...'; }
        }

        .score-bar {
          height: 3px;
          background: rgba(220,180,80,0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        .score-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #d4a017, #f0c030);
          transition: width 0.5s ease;
          border-radius: 2px;
        }

        .feedback-ok {
          background: rgba(60,180,80,0.08);
          border: 1px solid rgba(60,180,80,0.25);
        }
        .feedback-ko {
          background: rgba(200,70,70,0.08);
          border: 1px solid rgba(200,70,70,0.25);
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: "580px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "36px", paddingTop: "8px" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.35em", color: "rgba(220,180,80,0.35)", marginBottom: "10px" }}>
            ▸ QUIZ URBÀ ◂
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(30px, 7vw, 46px)",
            fontWeight: 900,
            color: "#f0c030",
            margin: 0,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}>
            Carrers de<br />
            <span style={{ fontStyle: "italic" }}>Barcelona</span>
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center", marginTop: "14px" }}>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(220,180,80,0.3))" }} />
            <span style={{ fontSize: "16px" }}>🏛️</span>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(220,180,80,0.3), transparent)" }} />
          </div>
        </div>

        {/* Main card */}
        <div className="card" style={{ padding: "28px 24px" }}>

          {/* START SCREEN */}
          {gameState === "start" && (
            <div style={{ textAlign: "center" }}>
              <p style={{
                color: "rgba(220,200,140,0.65)",
                fontSize: "14px",
                lineHeight: 1.7,
                marginBottom: "28px",
                maxWidth: "380px",
                margin: "0 auto 28px",
              }}>
                Comença en una cruïlla de Barcelona i navega pels seus carrers seguint les instruccions. Posa a prova el teu domini de la ciutat!
              </p>
              {error && (
                <div style={{ color: "#e07070", fontSize: "12px", marginBottom: "16px" }}>{error}</div>
              )}
              <button className="btn" onClick={startGame} style={{ padding: "14px 36px", fontSize: "13px", letterSpacing: "0.1em" }}>
                COMENÇAR
              </button>
            </div>
          )}

          {/* LOADING SCREEN */}
          {gameState === "loading" && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: "11px", letterSpacing: "0.3em", color: "rgba(220,180,80,0.4)" }}>
                <span className="loading-dots">CONSULTANT EL PLÀNOL</span>
              </div>
            </div>
          )}

          {/* PLAYING SCREEN */}
          {gameState === "playing" && currentData && (
            <div className="fade-in">

              {/* Score row */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(220,180,80,0.4)" }}>
                    PREGUNTA {questionCount + 1}
                  </span>
                  <span style={{ fontSize: "11px", color: "rgba(220,180,80,0.55)" }}>
                    {score}/{questionCount} {questionCount > 0 ? `· ${accuracy}%` : ""}
                  </span>
                </div>
                {questionCount > 0 && (
                  <div className="score-bar">
                    <div className="score-bar-fill" style={{ width: `${accuracy}%` }} />
                  </div>
                )}
              </div>

              {/* Feedback */}
              {feedback && (
                <div className={`fade-in ${feedback.correct ? "feedback-ok" : "feedback-ko"}`}
                  style={{ padding: "12px 14px", marginBottom: "20px", borderRadius: "2px" }}>
                  <div style={{ fontSize: "12px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "14px", flexShrink: 0 }}>{feedback.correct ? "✓" : "✗"}</span>
                    <div>
                      <span style={{ color: feedback.correct ? "#6ddd8a" : "#e07070" }}>
                        {feedback.text}
                      </span>
                      {!feedback.correct && feedback.correct_answer && (
                        <div style={{ marginTop: "5px", color: "rgba(220,200,140,0.5)", fontSize: "11px" }}>
                          Resposta correcta: <span style={{ color: "#f0c030" }}>{feedback.correct_answer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              <div style={{ marginBottom: "18px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "0.25em", color: "rgba(220,180,80,0.35)", marginBottom: "6px" }}>
                  📍 POSICIÓ ACTUAL
                </div>
                <div style={{
                  fontSize: "17px",
                  fontWeight: 600,
                  color: "#f0c030",
                  lineHeight: 1.35,
                  borderBottom: "1px solid rgba(220,180,80,0.12)",
                  paddingBottom: "14px",
                }}>
                  {currentData.location}
                </div>
              </div>

              {/* Instruction */}
              <div style={{
                background: "rgba(220,180,80,0.05)",
                borderLeft: "2px solid rgba(220,180,80,0.5)",
                padding: "14px 16px",
                marginBottom: "22px",
                fontSize: "15px",
                lineHeight: 1.65,
                color: "#dcc98a",
              }}>
                {currentData.instruction}
              </div>

              {/* Input */}
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  ref={inputRef}
                  className="answer-input"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Escriu el carrer o la cruïlla..."
                  disabled={gameState === "loading"}
                />
                <button
                  className="btn"
                  onClick={submitAnswer}
                  disabled={!userInput.trim() || gameState === "loading"}
                >
                  →
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Footer actions */}
        {(gameState === "playing") && (
          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <button className="btn-ghost" onClick={startGame}>
              REINICIAR
            </button>
          </div>
        )}

        {/* Credit */}
        <div style={{ textAlign: "center", marginTop: "32px", fontSize: "10px", color: "rgba(220,180,80,0.2)", letterSpacing: "0.15em" }}>
          POWERED BY CLAUDE AI
        </div>

      </div>
    </div>
  );
}
