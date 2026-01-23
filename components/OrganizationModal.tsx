
import React, { useState, useContext, useMemo, useEffect } from 'react';
import { UserGroupIcon, SearchIcon, XIcon, BoltIcon, CogIcon, ArrowLeftIcon } from './icons';
import { AppContext } from '../context/AppContext';

interface OrganizationModalProps {
    onSelect: (orgId: string) => void;
    onClose?: () => void;
    initialValue?: string;
}

const OrganizationModal: React.FC<OrganizationModalProps> = ({ onSelect, onClose, initialValue }) => {
    const { organizations, scriptUrl, setScriptUrl } = useContext(AppContext);
    const [selectedOrg, setSelectedOrg] = useState<string>(initialValue || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [showConfig, setShowConfig] = useState(false);
    const [tempUrl, setTempUrl] = useState(scriptUrl);

    useEffect(() => {
        setTempUrl(scriptUrl);
    }, [scriptUrl]);

    const filteredOrgs = useMemo(() => {
        if (!searchTerm) return organizations;
        return (organizations || []).filter(org => 
            org.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            String(org.id).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [organizations, searchTerm]);

    const handleSubmit = () => {
        if (selectedOrg) {
            onSelect(selectedOrg);
        }
    };

    const handleSaveUrl = () => {
        setScriptUrl(tempUrl);
        setShowConfig(false);
        alert("URL ถูกบันทึกเรียบร้อย");
    };

    return (
        <div className="fixed inset-0 z-[200] bg-white dark:bg-gray-900 overflow-y-auto animate-fade-in flex flex-col">
            <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col bg-white dark:bg-gray-900 shadow-none md:shadow-xl min-h-screen">
                
                {/* Navigation Bar (Sticky Top) */}
                <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex justify-between items-center shadow-sm">
                    {onClose ? (
                        <button 
                            onClick={onClose}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                            <span className="font-bold text-sm">ย้อนกลับ</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold">
                            <UserGroupIcon className="w-5 h-5" />
                            <span className="text-sm">Satun Healthy Life</span>
                        </div>
                    )}

                    {!onClose && (
                        <button 
                            onClick={() => setShowConfig(!showConfig)}
                            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 transition-colors"
                            title="ตั้งค่า URL"
                        >
                            <CogIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Hero / Header Section */}
                <div className="bg-gradient-to-br from-teal-600 to-emerald-600 p-8 text-white text-center shrink-0">
                    <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-lg">
                        <UserGroupIcon className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 tracking-tight">ระบุหน่วยงานของคุณ</h2>
                    <p className="text-teal-100 text-sm font-medium">เลือกโรงพยาบาลหรือหน่วยงานที่ท่านสังกัด <br/>เพื่อให้เราดูแลข้อมูลสุขภาพได้อย่างถูกต้อง</p>
                </div>

                {/* Config Section (Hidden by default) */}
                {showConfig && (
                    <div className="p-6 bg-slate-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 animate-slide-up">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">Google Apps Script Web App URL</label>
                        <input 
                            type="text" 
                            value={tempUrl}
                            onChange={(e) => setTempUrl(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-mono mb-3 focus:ring-2 focus:ring-teal-500 outline-none text-gray-700 dark:text-white dark:bg-gray-700"
                            placeholder="https://script.google.com/..."
                        />
                        <button onClick={handleSaveUrl} className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition-colors">
                            บันทึกการตั้งค่า
                        </button>
                    </div>
                )}

                {/* Search & List Section */}
                <div className="p-4 flex-1 flex flex-col">
                    <div className="relative mb-4 sticky top-[60px] z-10">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-4 py-3 border-2 border-gray-100 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 sm:text-sm text-gray-900 dark:text-white shadow-sm transition-all"
                            placeholder="พิมพ์ชื่อโรงพยาบาล / หน่วยงาน..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3 pb-24">
                        {filteredOrgs.length > 0 ? (
                            filteredOrgs.map((org) => (
                                <label 
                                    key={org.id} 
                                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.98] ${
                                        selectedOrg === org.id 
                                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-md ring-2 ring-teal-500/20' 
                                        : 'border-gray-100 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-700 bg-white dark:bg-gray-800'
                                    }`}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 flex-shrink-0 transition-colors ${selectedOrg === org.id ? 'border-teal-500' : 'border-gray-300 dark:border-gray-500'}`}>
                                        {selectedOrg === org.id && <div className="w-3 h-3 rounded-full bg-teal-500" />}
                                    </div>
                                    <input 
                                        type="radio" 
                                        name="organization" 
                                        value={org.id} 
                                        checked={selectedOrg === org.id}
                                        onChange={(e) => setSelectedOrg(e.target.value)}
                                        className="hidden"
                                    />
                                    <span className={`text-base font-bold ${selectedOrg === org.id ? 'text-teal-700 dark:text-teal-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {org.name}
                                    </span>
                                </label>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                                    <SearchIcon className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-medium">ไม่พบหน่วยงานที่ค้นหา</p>
                                <p className="text-xs text-gray-400 mt-1">ลองใช้คำค้นหาอื่น หรือเลือก "บุคคลทั่วไป"</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Action Bar (Sticky Bottom) */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-30 safe-area-bottom">
                    <div className="max-w-2xl mx-auto">
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedOrg}
                            className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all transform active:scale-95 text-lg flex items-center justify-center gap-2"
                        >
                            <span>ยืนยันการเลือก</span>
                            {selectedOrg && <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-normal">({filteredOrgs.find(o => o.id === selectedOrg)?.name?.substring(0, 10)}...)</span>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizationModal;
