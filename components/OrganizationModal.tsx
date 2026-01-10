
import React, { useState, useContext, useMemo, useEffect } from 'react';
import { UserGroupIcon, SearchIcon, XIcon, BoltIcon, CogIcon } from './icons';
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
        // Just save local state, no validation ping to avoid errors
        alert("URL ถูกบันทึกเรียบร้อย");
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-bounce-in max-h-[85vh]">
                
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-1 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                )}

                {!onClose && (
                    <button 
                        onClick={() => setShowConfig(!showConfig)}
                        className="absolute top-4 right-4 z-10 p-1 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                        title="ตั้งค่า URL ฐานข้อมูล"
                    >
                        <CogIcon className="w-5 h-5" />
                    </button>
                )}

                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-white text-center flex-shrink-0 transition-all">
                    <div className="flex justify-center mb-3">
                        <div className="bg-white/20 p-3 rounded-full">
                            <UserGroupIcon className="w-8 h-8" />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold">ระบุหน่วยงานของคุณ</h2>
                    <p className="text-teal-100 text-sm mt-1">เพื่อให้เราดูแลคุณได้อย่างทั่วถึง</p>
                </div>

                {/* Config Mode Overlay */}
                {showConfig && (
                    <div className="p-6 bg-slate-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 animate-slide-up">
                        <label className="block text-xs font-bold text-gray-500 mb-2">Google Apps Script Web App URL (สำหรับการบันทึกข้อมูล)</label>
                        <input 
                            type="text" 
                            value={tempUrl}
                            onChange={(e) => setTempUrl(e.target.value)}
                            className="w-full p-2 border border-blue-300 rounded-lg text-xs font-mono mb-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                            placeholder="https://script.google.com/macros/s/..."
                        />
                        <button onClick={handleSaveUrl} className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-blue-700">
                            บันทึก URL
                        </button>
                    </div>
                )}

                {/* Search & Content */}
                <div className="p-6 space-y-4 flex-1 flex flex-col min-h-0">
                    <p className="text-gray-600 dark:text-gray-300 text-sm text-center">
                        ค้นหาและเลือกหน่วยงาน/โรงพยาบาลที่คุณสังกัด <br/>เพื่อการรวบรวมข้อมูลสุขภาพที่แม่นยำ
                    </p>

                    {/* Search Box */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm text-gray-900 dark:text-white"
                            placeholder="พิมพ์ชื่อโรงพยาบาล / หน่วยงาน..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus={!showConfig}
                        />
                    </div>

                    <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar flex-1 border rounded-xl p-2 dark:border-gray-700 min-h-[100px]">
                        {filteredOrgs.length > 0 ? (
                            filteredOrgs.map((org) => (
                                <label 
                                    key={org.id} 
                                    className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                        selectedOrg === org.id 
                                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-md' 
                                        : 'border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-700'
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 flex-shrink-0 ${selectedOrg === org.id ? 'border-teal-500' : 'border-gray-400'}`}>
                                        {selectedOrg === org.id && <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />}
                                    </div>
                                    <input 
                                        type="radio" 
                                        name="organization" 
                                        value={org.id} 
                                        checked={selectedOrg === org.id}
                                        onChange={(e) => setSelectedOrg(e.target.value)}
                                        className="hidden"
                                    />
                                    <span className={`text-sm font-bold ${selectedOrg === org.id ? 'text-teal-700 dark:text-teal-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {org.name}
                                    </span>
                                </label>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-4 space-y-2">
                                <p className="text-gray-500 text-sm">ไม่พบหน่วยงานที่ค้นหา</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0 flex items-center gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedOrg}
                        className="flex-1 py-3 bg-teal-600 text-white font-bold rounded-xl shadow-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform active:scale-95"
                    >
                        ยืนยันการเลือก
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrganizationModal;
