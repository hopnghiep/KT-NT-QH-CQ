
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import type { HistoryItem, UserPassword, WelcomeData } from '../types';
import { Icon } from './icons';
import { ImageDropzone } from './ImageDropzone';

export const WelcomeScreen: React.FC<{ 
    onStart: (mode: 'free' | 'pro') => void; 
    history: HistoryItem[];
}> = ({ onStart, history }) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setThemeType } = useTheme();
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Auth & Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminInput, setAdminInput] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem('aicomplex_admin_pwd') || '123');
  const [userPasswords, setUserPasswords] = useState<UserPassword[]>(() => {
    const saved = localStorage.getItem('aicomplex_user_pwds');
    return saved ? JSON.parse(saved) : [];
  });
  
  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserPwd, setNewUserPwd] = useState('');

  // Login Modal
  const [showLogin, setShowLogin] = useState(false);
  const [userLoginInput, setUserLoginInput] = useState('');

  // Welcome Content State
  const [welcomeData, setWelcomeData] = useState<WelcomeData>(() => {
    const saved = localStorage.getItem('aicomplex_welcome_data');
    return saved ? JSON.parse(saved) : {
      title: 'AIVISION',
      subtitle: 'KIẾN TRÚC & NỘI THẤT & QUY HOẠCH & CẢNH QUAN',
      description: 'Lĩnh vực kiến trúc, nội thất, quy hoạch chất lượng cao.',
      bgImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop'
    };
  });

  useEffect(() => {
    localStorage.setItem('aicomplex_admin_pwd', adminPassword);
    localStorage.setItem('aicomplex_user_pwds', JSON.stringify(userPasswords));
    localStorage.setItem('aicomplex_welcome_data', JSON.stringify(welcomeData));
  }, [adminPassword, userPasswords, welcomeData]);

  // Check auto-login on mount
  useEffect(() => {
    const sessionPwd = localStorage.getItem('aicomplex_current_session');
    if (sessionPwd && userPasswords.some(u => u.password === sessionPwd)) {
      onStart('free');
    }
  }, [userPasswords, onStart]);

  const handleAdminLogin = () => {
    if (adminInput === adminPassword) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminInput('');
    } else {
      alert(t('invalidPassword'));
    }
  };

  const handleUserLogin = () => {
    if (userPasswords.some(u => u.password === userLoginInput)) {
      localStorage.setItem('aicomplex_current_session', userLoginInput);
      onStart('free');
    } else {
      alert(t('invalidPassword'));
    }
  };

  const generateRandomPwd = () => {
    const pwd = Math.random().toString(36).slice(-8).toUpperCase();
    setNewUserPwd(pwd);
  };

  const handleAddUser = () => {
    if (!newUserName || !newUserPwd) return;
    setUserPasswords([...userPasswords, { id: Date.now().toString(), name: newUserName, password: newUserPwd }]);
    setNewUserName('');
    setNewUserPwd('');
  };

  const handleRemoveUser = (id: string) => {
    setUserPasswords(userPasswords.filter(u => u.id !== id));
  };

  return (
    <div className={`min-h-screen w-full ${theme.appBg} ${theme.textMain} flex flex-col relative overflow-hidden transition-colors duration-300`}>
        {/* Background Gradient to match image */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a2b4b] via-[#0d1117] to-[#1a2b4b] opacity-60"></div>
        
        {/* Top Navigation */}
        <div className="w-full p-6 flex justify-between items-center z-20 relative px-10">
            <div className={`flex space-x-8 text-[11px] font-black tracking-widest ${theme.textSub} uppercase`}>
                <button onClick={() => {setShowHistory(false); setShowSettings(false)}} className={`hover:${theme.textMain} transition-colors ${!showHistory && !showSettings ? 'text-white' : ''}`}>{t('navHome')}</button>
                <button onClick={() => {setShowHistory(true); setShowSettings(false)}} className={`hover:${theme.textMain} transition-colors ${showHistory ? 'text-white' : ''}`}>{t('navHistory')}</button>
                <button onClick={() => {setShowSettings(true); setShowHistory(false)}} className={`hover:${theme.textMain} transition-colors ${showHistory ? '' : showSettings ? 'text-white' : ''}`}>{t('navSettings')}</button>
                {isAdmin && (
                    <button className="text-orange-500 flex items-center gap-1 animate-pulse">
                        <Icon name="cog" className="w-4 h-4" />
                        ADMIN MODE
                    </button>
                )}
            </div>

            <div className="flex space-x-1">
                <button onClick={() => setLanguage('vi')} className={`px-2 py-0.5 text-[10px] font-black rounded ${language === 'vi' ? 'bg-red-600 text-white' : `bg-slate-800 text-slate-400`}`}>VN</button>
                <button onClick={() => setLanguage('en')} className={`px-2 py-0.5 text-[10px] font-black rounded ${language === 'en' ? 'bg-orange-600 text-white' : `bg-slate-800 text-slate-400`}`}>EN</button>
            </div>
        </div>

        {/* Admin Login Modal */}
        {showAdminLogin && (
            <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
                <div className={`${theme.panelBg} border ${theme.border} p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-scale-up`}>
                    <div className="text-center mb-8">
                        <Icon name="cog" className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                        <h2 className="text-xl font-black uppercase tracking-widest">{t('adminLoginTitle')}</h2>
                    </div>
                    <div className="relative mb-6">
                        <input 
                            type="password"
                            value={adminInput}
                            onChange={(e) => setAdminInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                            className={`w-full ${theme.inputBg} ${theme.textMain} px-6 py-4 rounded-2xl border ${theme.border} outline-none focus:border-orange-500`}
                            placeholder="Mật khẩu quản trị..."
                            autoFocus
                        />
                    </div>
                    <button onClick={handleAdminLogin} className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 mb-4">ĐĂNG NHẬP</button>
                    <button onClick={() => setShowAdminLogin(false)} className="w-full py-2 text-slate-500 hover:text-white text-xs font-bold uppercase">{t('cancel')}</button>
                </div>
            </div>
        )}

        {/* User Login Modal */}
        {showLogin && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                <div className={`${theme.panelBg} border ${theme.border} p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-scale-up`}>
                    <div className="text-center mb-8">
                        <Icon name="key" className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                        <h2 className="text-xl font-black uppercase tracking-widest">{t('loginRequired')}</h2>
                    </div>
                    <div className="relative mb-6">
                        <input 
                            type={showPwd ? "text" : "password"}
                            value={userLoginInput}
                            onChange={(e) => setUserLoginInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUserLogin()}
                            className={`w-full ${theme.inputBg} ${theme.textMain} px-6 py-4 rounded-2xl border ${theme.border} outline-none focus:border-orange-500`}
                            placeholder="••••••••"
                            autoFocus
                        />
                        <button onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                            <Icon name={showPwd ? "eye-slash" : "eye"} className="w-5 h-5" />
                        </button>
                    </div>
                    <button onClick={handleUserLogin} className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 mb-4">TIẾP TỤC</button>
                    <button onClick={() => setShowLogin(false)} className="w-full py-2 text-slate-500 hover:text-white text-xs font-bold uppercase">{t('cancel')}</button>
                </div>
            </div>
        )}

        {/* Settings View */}
        {showSettings && (
            <div className={`fixed inset-0 z-50 ${theme.appBg}/95 backdrop-blur-sm flex flex-col pt-20 px-4 md:px-20 pb-10 overflow-hidden`}>
                <div className={`flex items-center justify-between mb-6 border-b ${theme.border} pb-4`}>
                    <h2 className="text-2xl font-light tracking-[0.2em] uppercase">{t('settingsTitle')}</h2>
                    <button onClick={() => setShowSettings(false)} className={`${theme.textSub} hover:${theme.textMain} transition-colors`}>
                        <Icon name="x-circle" className="w-8 h-8" />
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto thin-scrollbar max-w-5xl mx-auto w-full space-y-12 pb-20">
                    {/* Appearance Section */}
                    <section>
                        <h3 className={`text-xl font-medium mb-6 flex items-center gap-2 ${theme.textMain}`}>
                            <Icon name="sparkles" className="w-5 h-5" />
                            {t('appearance')}
                        </h3>
                        <div className={`p-6 rounded-3xl border ${theme.border} ${theme.panelBg} grid grid-cols-2 md:grid-cols-4 gap-4 shadow-xl`}>
                            {['dark', 'light', 'warm', 'cold'].map((type: any) => (
                                <button key={type} onClick={() => setThemeType(type)} className={`relative h-24 rounded-2xl border-2 transition-all overflow-hidden ${theme.id === type ? 'border-orange-500 ring-4 ring-orange-500/10' : 'border-transparent hover:border-slate-500'}`}>
                                    <div className={`absolute inset-0 ${type === 'dark' ? 'bg-[#0f172a]' : type === 'light' ? 'bg-white' : type === 'warm' ? 'bg-[#1c1917]' : 'bg-[#020617]'}`}></div>
                                    <div className="absolute bottom-0 left-0 w-full p-2 bg-black/60 text-white text-[10px] font-black text-center uppercase tracking-widest">{type}</div>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Admin Access / Admin Control Sections */}
                    <div className="flex flex-col items-center gap-8 py-10 border-t border-white/5">
                        {!isAdmin ? (
                            <button 
                                onClick={() => setShowAdminLogin(true)}
                                className={`px-8 py-3 rounded-full border border-white/10 ${theme.panelBg} text-slate-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:border-orange-500/50 hover:text-white transition-all shadow-xl`}
                            >
                                <Icon name="cog" className="w-4 h-4" />
                                {t('adminSettings')}
                            </button>
                        ) : (
                            <div className="w-full space-y-12 animate-scale-up">
                                {/* 1. User Management */}
                                <section>
                                    <h3 className={`text-xl font-medium mb-6 flex items-center gap-2 ${theme.textMain}`}>
                                        <Icon name="key" className="w-5 h-5 text-orange-500" />
                                        {t('userManagement')}
                                    </h3>
                                    <div className={`p-8 rounded-[2.5rem] border ${theme.border} ${theme.panelBg} shadow-2xl`}>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                            <input value={newUserName} onChange={e => setNewUserName(e.target.value)} className={`p-4 rounded-2xl ${theme.inputBg} border ${theme.border} text-sm outline-none`} placeholder={t('userNamePlaceholder')} />
                                            <div className="relative">
                                                <input value={newUserPwd} onChange={e => setNewUserPwd(e.target.value)} className={`w-full p-4 rounded-2xl ${theme.inputBg} border ${theme.border} text-sm outline-none pr-24`} placeholder={t('userPasswordPlaceholder')} />
                                                <button onClick={generateRandomPwd} className="absolute right-2 top-2 px-3 py-2 bg-slate-800 text-[9px] font-black text-white rounded-xl hover:bg-slate-700">{t('generateRandom')}</button>
                                            </div>
                                            <button onClick={handleAddUser} className="bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all">{t('addUser')}</button>
                                        </div>
                                        <div className="space-y-3">
                                            {userPasswords.map(user => (
                                                <div key={user.id} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5 group">
                                                    <div className="flex gap-8">
                                                        <span className="text-white font-bold text-sm w-32 truncate">{user.name}</span>
                                                        <span className="font-mono text-orange-500 text-sm tracking-widest">{user.password}</span>
                                                    </div>
                                                    <button onClick={() => handleRemoveUser(user.id)} className="p-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Icon name="trash" className="w-4 h-4" /></button>
                                                </div>
                                            ))}
                                            {userPasswords.length === 0 && <p className="text-center text-slate-500 text-sm italic py-4">Chưa có người dùng nào được tạo.</p>}
                                        </div>
                                    </div>
                                </section>

                                {/* 2. Welcome Data Editor */}
                                <section>
                                    <h3 className={`text-xl font-medium mb-6 flex items-center gap-2 ${theme.textMain}`}>
                                        <Icon name="pencil" className="w-5 h-5 text-orange-500" />
                                        {t('welcomeEditor')}
                                    </h3>
                                    <div className={`p-8 rounded-[2.5rem] border ${theme.border} ${theme.panelBg} shadow-2xl space-y-6`}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-slate-500 px-1">{t('welcomeTitleLabel')}</label>
                                                <input value={welcomeData.title} onChange={e => setWelcomeData({...welcomeData, title: e.target.value})} className={`w-full p-4 rounded-2xl ${theme.inputBg} border ${theme.border} text-sm outline-none`} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-slate-500 px-1">{t('welcomeSubLabel')}</label>
                                                <input value={welcomeData.subtitle} onChange={e => setWelcomeData({...welcomeData, subtitle: e.target.value})} className={`w-full p-4 rounded-2xl ${theme.inputBg} border ${theme.border} text-sm outline-none`} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-500 px-1">{t('welcomeDescLabel')}</label>
                                            <textarea value={welcomeData.description} onChange={e => setWelcomeData({...welcomeData, description: e.target.value})} className={`w-full p-4 rounded-2xl ${theme.inputBg} border ${theme.border} text-sm outline-none h-24 resize-none`} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-500 px-1">Background Image URL</label>
                                            <input value={welcomeData.bgImage} onChange={e => setWelcomeData({...welcomeData, bgImage: e.target.value})} className={`w-full p-4 rounded-2xl ${theme.inputBg} border ${theme.border} text-sm outline-none`} />
                                        </div>
                                    </div>
                                </section>

                                {/* 3. Admin Security */}
                                <section>
                                    <h3 className={`text-xl font-medium mb-6 flex items-center gap-2 ${theme.textMain}`}>
                                        <Icon name="key" className="w-5 h-5 text-orange-500" />
                                        Admin Security
                                    </h3>
                                    <div className={`p-8 rounded-[2.5rem] border ${theme.border} ${theme.panelBg} shadow-2xl`}>
                                        <div className="flex gap-4">
                                            <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className={`flex-grow p-4 rounded-2xl ${theme.inputBg} border ${theme.border} text-sm outline-none`} placeholder="Mật khẩu Admin mới" />
                                            <button onClick={() => setIsAdmin(false)} className="px-8 bg-slate-800 text-white font-black rounded-2xl hover:bg-slate-700">ĐĂNG XUẤT ADMIN</button>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Main Content Area */}
        <div className={`flex-grow flex flex-col items-center justify-center z-10 transition-opacity duration-300 ${showHistory || showSettings ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            
            {/* Header Text Block */}
            <div className="text-center mb-10 w-full max-w-[1080px] animate-scale-up px-8 flex flex-col items-center">
                {/* Fixed "AIVISION" with Swis721 font and 1.5x size compared to previous */}
                <h1 
                    className="font-black text-white uppercase mb-4 drop-shadow-[0_0_25px_rgba(255,255,255,0.2)] w-full text-center"
                    style={{ 
                        fontFamily: "'Swis721 BlkEx BT', 'Swiss 721 Black Extended', 'Arial Black', sans-serif",
                        fontSize: 'clamp(54px, 10vw, 90px)', // 1.5x scale (4xl->54px, 6xl->90px)
                        letterSpacing: '0.12em',
                        lineHeight: '1.2',
                        padding: '0.2em 0',
                        textRendering: 'optimizeLegibility',
                        WebkitFontSmoothing: 'antialiased',
                        fontVariantLigatures: 'none'
                    }}
                >
                    {welcomeData.title}
                </h1>
                
                {/* Subtitle - Ensuring exact alignment width with main title */}
                <h2 className="text-lg md:text-2xl font-black tracking-[0.2em] text-white uppercase opacity-90 mb-10 w-full text-center border-t border-white/10 pt-4">
                    {welcomeData.subtitle}
                </h2>

                <div className="flex flex-col items-center">
                    <p className="text-[9px] md:text-[10px] font-bold uppercase text-slate-500 tracking-[0.12em] opacity-80">
                        {t('developedBy')} • {t('sponsoredBy')}
                    </p>
                </div>
            </div>

            {/* Main Interactive Card */}
            <div className="w-full max-w-[1024px] px-8 flex justify-center animate-scale-up">
                <div 
                    onClick={() => setShowLogin(true)}
                    className="group relative h-[520px] w-full rounded-[2.5rem] overflow-hidden cursor-pointer border border-white/10 hover:border-white/30 transition-all duration-500 shadow-[0_30px_90px_rgba(0,0,0,0.6)] active:scale-[0.99]"
                >
                    {/* Dark Overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10 opacity-90"></div>
                    
                    {/* Background Image */}
                    <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                        style={{ backgroundImage: `url(${welcomeData.bgImage})` }}
                    ></div>
                    
                    {/* Content inside the card */}
                    <div className="absolute inset-0 z-20 p-12 flex flex-col justify-between">
                        {/* Top Label */}
                        <div className="self-start">
                            <span className="bg-[#fbff00] text-black text-[11px] font-black px-5 py-2 rounded-lg shadow-xl tracking-widest uppercase inline-block">
                                {t('toolLabel')}
                            </span>
                        </div>
                        
                        {/* Bottom Text Area */}
                        <div className="flex flex-col gap-3 items-start">
                            <h2 className="text-xl md:text-2xl font-black text-slate-500 tracking-tighter drop-shadow-2xl uppercase">
                                {t('freeGenTitle')}
                            </h2>
                            <p className="text-slate-200 text-lg md:text-xl font-bold tracking-tight opacity-90 drop-shadow-md">
                                {welcomeData.description}
                            </p>
                            
                            {/* Click Hint */}
                            <div className="mt-4 flex items-center gap-2 text-white/40 uppercase text-[9px] font-black tracking-[0.4em] animate-pulse">
                                <span>Click to enter ecosystem</span>
                                <div className="w-8 h-[1px] bg-white/20"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Secret Admin Access Area */}
        {!isAdmin && (
            <button 
                onClick={() => setShowAdminLogin(true)} 
                className="absolute bottom-6 left-6 opacity-0 hover:opacity-100 transition-opacity p-2 text-slate-800"
                title="Admin access"
            >
                <Icon name="cog" className="w-4 h-4" />
            </button>
        )}
    </div>
  );
};
