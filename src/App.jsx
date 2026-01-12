import { useState, useRef, useEffect } from 'react';
import { Phone, Mail, Clock, MapPin, ChevronDown, ChevronRight, Send, X, Scale, ArrowUpRight, Train, MessageCircle, FileText, Heart, Car, Home, CreditCard, Building, HelpCircle, CheckCircle2, Circle } from 'lucide-react';

export default function App() {
  const [showChat, setShowChat] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [bookingData, setBookingData] = useState({ name: '', tel: '', category: '', message: '' });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);

  const categories = [
    { id: 'divorce', label: '離婚・男女問題', icon: Heart },
    { id: 'inheritance', label: '相続', icon: FileText },
    { id: 'accident', label: '交通事故', icon: Car },
    { id: 'property', label: '不動産', icon: Home },
    { id: 'debt', label: '借金問題', icon: CreditCard },
    { id: 'corporate', label: '企業法務', icon: Building },
    { id: 'other', label: 'その他', icon: HelpCircle },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startChat = (category) => {
    setSelectedCategory(category);
    setShowChat(true);
    const categoryLabel = categories.find(c => c.id === category)?.label || 'ご相談';
    setMessages([
      { role: 'assistant', content: `${categoryLabel}のご相談ですね。\n\n詳しい状況をお聞かせください。どのようなことでお困りですか？` }
    ]);
    setTimeout(() => {
      chatRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const generateResponse = async (userMessage, history) => {
    const categoryLabel = categories.find(c => c.id === selectedCategory)?.label || 'ご相談';

    const systemPrompt = `あなたは「崎岡綜合法律経済事務所」の代表弁護士・崎岡良一として相談を受けます。

【キャラクター】
- 弁護士歴30年、3,000件以上の相談実績
- モットーは「情熱・迅速・的確」
- 話しやすい雰囲気だが、プロとしての信頼感がある
- 一人称は「私」、敬語で話す

【相談カテゴリ】
${categoryLabel}

【対応の流れ】
1. まず共感を示し、状況を聞く
2. 必要に応じて1-2個の補足質問
3. 「直接お話しすれば、より具体的にお伝えできます」と伝える
4. 自然な流れで予約・お問い合わせを提案

【ヒアリング項目（さりげなく）】
- いつ頃からの問題か
- 相手との関係性
- 希望する解決の方向性

【ルール】
- 1回の返答は100〜150文字程度
- 法的断定・具体的アドバイスはしない
- 「一般的には〜」「ケースによりますが〜」等でぼかす
- 相談者の不安に寄り添う一言を入れる
- 3-4往復で予約提案、ただし自然な流れで`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          system: systemPrompt,
          messages: history.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await response.json();
      return data.content?.[0]?.text || 'すみません、うまく応答できませんでした。';
    } catch (e) {
      return 'すみません、通信エラーが発生しました。';
    }
  };

  const generateSummary = async (history) => {
    const systemPrompt = `以下の相談内容を、弁護士に伝えるために簡潔にまとめてください。

【フォーマット】
■ 相談カテゴリ：〇〇
■ 状況：（2-3文で）
■ 相談者の希望：（あれば）

箇条書きで100文字以内にまとめてください。`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          system: systemPrompt,
          messages: [{ role: 'user', content: history.map(m => `${m.role}: ${m.content}`).join('\n') }]
        })
      });
      const data = await response.json();
      return data.content?.[0]?.text || '';
    } catch (e) {
      return '相談内容の要約を作成できませんでした。';
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsTyping(true);

    const response = await generateResponse(input.trim(), newHistory);
    const updatedHistory = [...newHistory, { role: 'assistant', content: response }];
    setMessages(updatedHistory);
    setIsTyping(false);

    // 3往復以上で要約提案
    const userMsgCount = updatedHistory.filter(m => m.role === 'user').length;
    if (userMsgCount >= 3 && !showSummary) {
      setTimeout(async () => {
        const summaryText = await generateSummary(updatedHistory);
        setSummary(summaryText);
        setShowSummary(true);
        setBookingData(prev => ({ ...prev, category: selectedCategory, message: summaryText }));
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-lg border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="text-sm font-bold text-slate-900">崎岡法律事務所</div>
          <a href="mailto:info@sakioka.jp" className="text-xs font-medium text-red-600">
            お問い合わせ
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-8 px-4">
        <div className="max-w-lg mx-auto text-center">
          {/* キャラクター */}
          <div className="mb-6">
            <img
              src="/sakioka-avatar.gif"
              alt="崎岡弁護士"
              className="w-32 h-40 mx-auto object-contain"
            />
          </div>

          {/* メインコピー */}
          <p className="text-red-600 text-sm font-bold mb-2">弁護士歴30年</p>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4 leading-tight">
            3,000件以上の相談実績。<br />
            30年、あなたの側に立ち続ける。
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            まずはAIで、気軽に話してみてください。
          </p>

          {/* 信頼バッジ */}
          <div className="flex flex-wrap justify-center gap-3 mb-8 text-xs">
            <span className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full text-slate-700">
              <CheckCircle2 size={14} className="text-emerald-500" />
              初回30分無料
            </span>
            <span className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full text-slate-700">
              <CheckCircle2 size={14} className="text-emerald-500" />
              大阪駅徒歩3分
            </span>
            <span className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full text-slate-700">
              <CheckCircle2 size={14} className="text-emerald-500" />
              土日夜間対応可
            </span>
          </div>
        </div>
      </section>

      {/* 悩みカテゴリ選択 */}
      <section className="px-4 pb-8">
        <div className="max-w-lg mx-auto">
          <p className="text-center text-base font-bold text-slate-900 mb-2">
            まず、お悩みを選んでください
          </p>
          <p className="text-center text-xs text-slate-500 mb-4">
            タップするとAI相談が始まります
          </p>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => startChat(cat.id)}
                  className={`flex items-center justify-between border-2 rounded-xl px-4 py-4 text-left transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-red-600 border-red-600 shadow-lg shadow-red-200'
                      : 'bg-white border-slate-200 hover:border-red-400 hover:shadow-md shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <cat.icon size={20} className={isSelected ? 'text-white' : 'text-red-500'} />
                    <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>{cat.label}</span>
                  </div>
                  <ChevronRight size={18} className={isSelected ? 'text-white' : 'text-slate-300'} />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* チャットモーダル（フルスクリーン） */}
      {showChat && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Chat Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white">
                <img src="/sakioka-avatar.gif" alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="text-white text-sm font-bold">崎岡弁護士 AI</div>
                <div className="text-slate-400 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  {categories.find(c => c.id === selectedCategory)?.label || '相談中'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="text-slate-400 hover:text-white p-2"
            >
              <X size={24} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-red-600 text-white' : 'bg-white text-slate-700 border border-slate-200'} rounded-2xl px-4 py-3 shadow-sm`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Summary Card */}
          {showSummary && (
            <div className="p-4 bg-amber-50 border-t border-amber-200 shrink-0">
              <p className="text-xs font-medium text-amber-800 mb-2">相談内容をまとめました</p>
              <div className="bg-white rounded-lg p-3 text-xs text-slate-600 mb-3 whitespace-pre-wrap">
                {summary}
              </div>
              <button
                onClick={() => setShowBooking(true)}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                この内容で予約する
                <ArrowUpRight size={16} />
              </button>
            </div>
          )}

          {/* Input - 下部固定 */}
          {!showSummary && (
            <div className="p-3 bg-white border-t border-slate-200 shrink-0 safe-area-bottom">
              <div className="flex gap-2 max-w-lg mx-auto">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSend()}
                  placeholder="お気軽にお話しください..."
                  className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
                <button
                  onClick={handleSend}
                  disabled={isTyping || !input.trim()}
                  className="bg-red-600 text-white px-4 rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 弁護士紹介 */}
      <section className="px-4 py-12 bg-white">
        <div className="max-w-lg mx-auto">
          <p className="text-center text-xs font-medium text-red-600 tracking-widest mb-2">LAWYERS</p>
          <h2 className="text-center text-xl font-bold text-slate-900 mb-6">弁護士紹介</h2>

          <div className="space-y-4">
            {/* 代表弁護士 */}
            <div className="bg-slate-50 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                <img
                  src="/sakioka-photo.jpg"
                  alt="崎岡良一弁護士"
                  className="w-32 h-40 object-cover rounded-xl shadow-lg"
                />
                <div className="text-center sm:text-left">
                  <p className="text-xs text-red-600 font-medium mb-1">代表弁護士</p>
                  <p className="font-bold text-xl mb-3">弁護士 崎岡 良一</p>
                  <div className="space-y-1 text-xs text-slate-600 mb-4">
                    <p>昭和62年 同志社大学 法学部卒業</p>
                    <p>昭和63年 司法試験合格</p>
                    <p>平成 3年 弁護士登録（大阪弁護士会）</p>
                    <p>平成14年 崎岡綜合法律経済事務所 開設</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mt-4 pt-4 border-t border-slate-200">
                弁護士歴30年以上。ITを駆使した合理的な仕事スタイルを追求しています。クライアントの立場に立ち、<strong>情熱・迅速・的確</strong>をモットーに最善を尽くします。
              </p>
            </div>

            {/* 所属弁護士 */}
            <div className="bg-slate-50 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                <div className="w-32 h-40 bg-slate-200 rounded-xl shadow-lg flex items-center justify-center">
                  <Scale size={40} className="text-slate-400" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs text-slate-500 mb-1">所属弁護士</p>
                  <p className="font-bold text-xl mb-3">弁護士 貞兼 紀夫</p>
                  <div className="space-y-1 text-xs text-slate-600 mb-4">
                    <p>同志社大学 法学部法律学科 卒業</p>
                    <p>関西大学大学院 法務研究科 修了</p>
                    <p>令和4年 弁護士登録（74期）</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mt-4 pt-4 border-t border-slate-200">
                世の中の様々な法的な問題に対し、最善の解決を目指して、可能な限りの結果を出せるよう日々業務に励んでおります。民事刑事を問わず皆様のお役に立てれば幸いです。どうぞお気軽にご相談ください。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 特徴バッジ */}
      <section className="py-6 bg-slate-100 overflow-hidden">
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
          <span className="shrink-0 bg-white border border-slate-200 px-4 py-2 rounded-full text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-red-500" />
            初回30分無料
          </span>
          <span className="shrink-0 bg-white border border-slate-200 px-4 py-2 rounded-full text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-red-500" />
            土日・夜間対応
          </span>
          <span className="shrink-0 bg-white border border-slate-200 px-4 py-2 rounded-full text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-red-500" />
            大阪駅徒歩3分
          </span>
          <span className="shrink-0 bg-white border border-slate-200 px-4 py-2 rounded-full text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-red-500" />
            分割払いOK
          </span>
          <span className="shrink-0 bg-white border border-slate-200 px-4 py-2 rounded-full text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-red-500" />
            オンライン相談可
          </span>
          <span className="shrink-0 bg-white border border-slate-200 px-4 py-2 rounded-full text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-red-500" />
            AIで事前相談可
          </span>
        </div>
      </section>

      {/* 取扱分野 */}
      <section className="px-4 py-12 bg-white">
        <div className="max-w-lg mx-auto">
          <p className="text-center text-xs font-medium text-red-600 tracking-widest mb-2">PRACTICE AREAS</p>
          <h2 className="text-center text-xl font-bold text-slate-900 mb-8">取扱分野</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart size={18} className="text-red-500" />
                <p className="font-bold text-slate-900 text-sm">離婚・男女問題</p>
              </div>
              <p className="text-xs text-slate-500">離婚協議、慰謝料、財産分与、親権・養育費など</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={18} className="text-red-500" />
                <p className="font-bold text-slate-900 text-sm">相続</p>
              </div>
              <p className="text-xs text-slate-500">遺産分割、遺言書作成、相続放棄、遺留分請求など</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Car size={18} className="text-red-500" />
                <p className="font-bold text-slate-900 text-sm">交通事故</p>
              </div>
              <p className="text-xs text-slate-500">示談交渉、後遺障害、損害賠償請求など</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Home size={18} className="text-red-500" />
                <p className="font-bold text-slate-900 text-sm">不動産</p>
              </div>
              <p className="text-xs text-slate-500">賃貸トラブル、立退き、売買契約、境界紛争など</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard size={18} className="text-red-500" />
                <p className="font-bold text-slate-900 text-sm">借金問題</p>
              </div>
              <p className="text-xs text-slate-500">債務整理、自己破産、個人再生、過払い金など</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building size={18} className="text-red-500" />
                <p className="font-bold text-slate-900 text-sm">企業法務</p>
              </div>
              <p className="text-xs text-slate-500">契約書作成、労務問題、債権回収、M&Aなど</p>
            </div>
          </div>
        </div>
      </section>

      {/* 選ばれる理由 */}
      <section className="px-4 py-12 bg-slate-50">
        <div className="max-w-lg mx-auto">
          <p className="text-center text-xs font-medium text-red-600 tracking-widest mb-2">WHY CHOOSE US</p>
          <h2 className="text-center text-xl font-bold text-slate-900 mb-8">選ばれる理由</h2>

          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-red-600 font-bold">1</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 mb-1">30年以上の実績と経験</p>
                  <p className="text-sm text-slate-500">3,000件を超える相談実績。豊富な経験に基づき、最適な解決策をご提案します。</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-red-600 font-bold">2</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 mb-1">情熱・迅速・的確な対応</p>
                  <p className="text-sm text-slate-500">クライアントの立場に立ち、スピード感を持って問題解決に取り組みます。</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-red-600 font-bold">3</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 mb-1">ITを活用した効率的な対応</p>
                  <p className="text-sm text-slate-500">AIチャットでの事前相談やオンライン対応など、時代に合わせたサービスを提供。</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-red-600 font-bold">4</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 mb-1">大阪駅から徒歩3分</p>
                  <p className="text-sm text-slate-500">大阪駅前第1ビル6階。抜群のアクセスで、お仕事帰りにも立ち寄りやすい立地です。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 料金 */}
      <section className="px-4 py-12 bg-white">
        <div className="max-w-lg mx-auto">
          <p className="text-center text-xs font-medium text-red-600 tracking-widest mb-2">FEE</p>
          <h2 className="text-center text-xl font-bold text-slate-900 mb-8">料金について</h2>

          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-5 rounded-xl text-center mb-6">
            <p className="text-xl font-bold">初回相談 30分無料</p>
            <p className="text-sm opacity-90 mt-1">まずはお気軽にご相談ください</p>
          </div>

          <div className="bg-slate-50 rounded-xl overflow-hidden">
            <div className="flex justify-between items-center py-4 px-4 border-b border-slate-200">
              <span className="text-sm text-slate-700">法律相談（30分以降）</span>
              <span className="text-sm font-bold text-slate-900">5,500円（税込）</span>
            </div>
            <div className="flex justify-between items-center py-4 px-4 border-b border-slate-200">
              <span className="text-sm text-slate-700">着手金</span>
              <span className="text-sm text-slate-600">事案により異なる</span>
            </div>
            <div className="flex justify-between items-center py-4 px-4">
              <span className="text-sm text-slate-700">報酬金</span>
              <span className="text-sm text-slate-600">事案により異なる</span>
            </div>
          </div>

          <div className="mt-4 p-4 bg-slate-100 rounded-xl">
            <p className="text-xs text-slate-500 leading-relaxed">
              ※ 料金は案件の内容・難易度により異なります。<br />
              ※ 詳細は初回相談時にご説明いたします。<br />
              ※ 分割払いにも対応しております。
            </p>
          </div>
        </div>
      </section>

      {/* 事務所情報 */}
      <section className="px-4 py-12 bg-slate-50">
        <div className="max-w-lg mx-auto">
          <p className="text-center text-xs font-medium text-red-600 tracking-widest mb-2">ACCESS</p>
          <h2 className="text-center text-xl font-bold text-slate-900 mb-8">事務所情報</h2>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 bg-slate-50 font-medium text-slate-600 w-24 text-xs">事務所名</th>
                  <td className="py-3 px-4 text-slate-900 text-sm">崎岡綜合法律経済事務所</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 bg-slate-50 font-medium text-slate-600 text-xs">代表者</th>
                  <td className="py-3 px-4 text-slate-900 text-sm">弁護士 崎岡 良一（大阪弁護士会）</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 bg-slate-50 font-medium text-slate-600 text-xs">所在地</th>
                  <td className="py-3 px-4 text-slate-900 text-sm">〒530-0001<br />大阪市北区梅田1-3-1-600号<br />大阪駅前第1ビル6階</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 bg-slate-50 font-medium text-slate-600 text-xs">アクセス</th>
                  <td className="py-3 px-4 text-slate-900 text-sm">JR大阪駅 徒歩3分<br />地下鉄梅田駅 徒歩2分</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 bg-slate-50 font-medium text-slate-600 text-xs">電話番号</th>
                  <td className="py-3 px-4">
                    <a href="tel:06-6346-2881" className="text-red-600 font-bold text-sm">06-6346-2881</a>
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 bg-slate-50 font-medium text-slate-600 text-xs">営業時間</th>
                  <td className="py-3 px-4 text-slate-900 text-sm">平日 9:30〜18:00</td>
                </tr>
                <tr>
                  <th className="text-left py-3 px-4 bg-slate-50 font-medium text-slate-600 text-xs">休日対応</th>
                  <td className="py-3 px-4 text-slate-900 text-sm">土日・夜間も事前予約で対応可</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 pb-24 text-center">
        <a
          href="https://www.facebook.com/sakioka.law"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#1877F2] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#166FE5] transition-colors mb-4"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Facebookをフォロー
        </a>
        <p className="text-xs text-slate-400">&copy; 2009 - {new Date().getFullYear()} 崎岡綜合法律経済事務所</p>
      </footer>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200 p-3 z-40 safe-area-bottom">
        <div className="max-w-lg mx-auto flex gap-2">
          <a href="tel:06-6346-2881" className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 text-slate-800 py-3 rounded-xl font-bold text-sm">
            <Phone size={16} />電話する
          </a>
          <a
            href="mailto:info@sakioka.jp"
            className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-bold text-sm"
          >
            <Mail size={16} />お問い合わせ
          </a>
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowBooking(false)} className="absolute top-4 right-4 text-slate-300 hover:text-slate-600">
              <X size={24} />
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-4">
              <Mail size={22} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">予約を確定する</h3>
            <p className="text-slate-500 mb-4 text-sm">連絡先を入力してください</p>

            {summary && (
              <div className="bg-slate-50 rounded-lg p-3 mb-4 text-xs text-slate-600">
                <p className="font-medium text-slate-700 mb-1">相談内容</p>
                <p className="whitespace-pre-wrap">{summary}</p>
              </div>
            )}

            <div className="space-y-3">
              <input
                type="text"
                placeholder="お名前"
                value={bookingData.name}
                onChange={e => setBookingData({...bookingData, name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
              <input
                type="tel"
                placeholder="電話番号"
                value={bookingData.tel}
                onChange={e => setBookingData({...bookingData, tel: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
              <button className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg transition-all">
                この内容で予約する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
