import React from 'react';
import Navbar from '../../components/layout/Navbar';
import AIChat from '../../components/AIChat';

const UserAI = () => <div className="min-h-screen bg-gray-50 py-8 dark:bg-slate-950"><Navbar /><main className="mx-auto max-w-6xl px-4 pt-8"><AIChat title="Personal attendance assistant" /></main></div>;

export default UserAI;
