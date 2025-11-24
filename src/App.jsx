import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  DollarSign, 
  User, 
  Shield, 
  Briefcase, 
  ChevronRight, 
  Settings,
  RefreshCw,
  Calendar,
  Database,
  AlertCircle,
  XOctagon,
  HelpCircle
} from 'lucide-react';

// --- Constants & Config ---

const STAGES = {
  APPLICATION: 'application',
  PRE_APPROVAL: 'pre_approval',
  DOCUMENTS: 'documents',
  UNDERWRITING: 'underwriting',
  APPROVAL_OFFER: 'approval_offer',
  CLOSING: 'closing',
  DISBURSED: 'disbursed',
  DISQUALIFIED: 'disqualified'
};

const STAGE_ORDER = [
  STAGES.APPLICATION,
  STAGES.PRE_APPROVAL,
  STAGES.DOCUMENTS,
  STAGES.UNDERWRITING,
  STAGES.APPROVAL_OFFER,
  STAGES.CLOSING,
  STAGES.DISBURSED
];

const STAGE_URL_SLUGS = {
  [STAGES.APPLICATION]: 'startYourApplication',
  [STAGES.PRE_APPROVAL]: 'analyzingEligibility',
  [STAGES.DOCUMENTS]: 'documentVerification',
  [STAGES.UNDERWRITING]: 'underwritingReview',
  [STAGES.APPROVAL_OFFER]: 'offerReview',
  [STAGES.CLOSING]: 'finalClosing',
  [STAGES.DISBURSED]: 'fundsDisbursed',
  [STAGES.DISQUALIFIED]: 'disqualified'
};

// Initial Empty State
const INITIAL_STATE = {
  id: '', 
  applicantName: '',
  email: '',
  income: '',
  loanAmount: 50000,
  creditScore: 720,
  status: STAGES.APPLICATION,
  documentsUploaded: false,
  history: [],
  simulatedStartDate: new Date().toISOString(),
  currentSimulatedDate: new Date().toISOString(),
};

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    success: "bg-green-600 text-white hover:bg-green-700",
    admin: "bg-slate-800 text-slate-200 hover:bg-slate-700 text-sm"
  };

  // CHAOS: 5% chance to throw a console error on any button click
  const handleClick = (e) => {
    if (Math.random() < 0.05) {
        console.error("[Analytics Demo] Simulated API Timeout Error: 504 Gateway Timeout");
    }
    onClick && onClick(e);
  };
  
  return (
    <button 
      onClick={handleClick} 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ label, id, type = "text", value, onChange, placeholder, error }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      id={id}
      data-analytics-id={`input-${id}`}
      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'}`}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
    {error && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={12}/> {error}</p>}
  </div>
);

const Card = ({ children, title, subtitle, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
    {(title || subtitle) && (
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
        <div>
            {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {/* CHAOS: Dead Click Target - Looks interactive but does nothing */}
        <div className="text-gray-400 cursor-help hover:text-gray-600" title="Help" id="dead-click-help">
            <HelpCircle size={20} />
        </div>
      </div>
    )}
    <div className="p-6">
      {children}
    </div>
  </div>
);

const Badge = ({ status }) => {
  const styles = {
    [STAGES.APPLICATION]: "bg-blue-100 text-blue-800",
    [STAGES.PRE_APPROVAL]: "bg-purple-100 text-purple-800",
    [STAGES.DOCUMENTS]: "bg-yellow-100 text-yellow-800",
    [STAGES.UNDERWRITING]: "bg-orange-100 text-orange-800",
    [STAGES.APPROVAL_OFFER]: "bg-indigo-100 text-indigo-800",
    [STAGES.CLOSING]: "bg-pink-100 text-pink-800",
    [STAGES.DISBURSED]: "bg-green-100 text-green-800",
    [STAGES.DISQUALIFIED]: "bg-red-100 text-red-800", 
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${styles[status] || 'bg-gray-100'}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

// --- Views ---

const ApplicationForm = ({ data, updateData, nextStage, identifyUser }) => {
  const [errors, setErrors] = useState({});

  const validate = () => {
      const newErrors = {};
      // Ensure valid email format for Heap identify
      if (!data.applicantName) newErrors.applicantName = "Name is required";
      if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) newErrors.email = "Valid email is required";
      if (!data.income || data.income < 1000) newErrors.income = "Valid annual income required";
      return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return; 
    }
    
    // HEAP IDENTIFY: Identify user before moving past the first step
    identifyUser(data.email, data.applicantName, data.id);

    nextStage(STAGES.PRE_APPROVAL, "Application Submitted");
  };

  return (
    <Card title="Start your Application" subtitle="Step 1 of 5">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Full Name" 
            id="applicantName" 
            value={data.applicantName} 
            onChange={(e) => updateData('applicantName', e.target.value)} 
            placeholder="e.g. Jane Doe"
            error={errors.applicantName}
          />
          <Input 
            label="Email Address" 
            id="email" 
            type="email"
            value={data.email} 
            onChange={(e) => updateData('email', e.target.value)} 
            placeholder="jane@example.com"
            error={errors.email}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Annual Income ($)" 
            id="income" 
            type="number"
            value={data.income} 
            onChange={(e) => updateData('income', e.target.value)} 
            placeholder="85000"
            error={errors.income}
          />
          <Input 
            label="Requested Loan Amount" 
            id="loanAmount" 
            type="number"
            value={data.loanAmount} 
            onChange={(e) => updateData('loanAmount', e.target.value)} 
          />
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="submit" id="btn-submit-application" data-analytics-id="submit-app">
            Check Eligibility <ChevronRight size={16} />
          </Button>
        </div>
      </form>
    </Card>
  );
};

const DocumentsView = ({ nextStage }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = () => {
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        nextStage(STAGES.UNDERWRITING, "Documents Uploaded");
      }
    }, 200);
  };

  return (
    <Card title="Document Verification" subtitle="Please upload your recent pay stubs.">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={handleUpload} id="dropzone">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
          <FileText size={48} />
        </div>
        <h3 className="text-sm font-medium text-gray-900">Upload Pay Stubs</h3>
        <p className="text-xs text-gray-500 mt-1">PDF or PNG up to 10MB</p>
        
        {isUploading && (
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        )}
      </div>
      <div className="mt-6 flex justify-between items-center">
         <p className="text-sm text-gray-500 italic">Note: This simulates a file upload event.</p>
         <Button onClick={handleUpload} disabled={isUploading} id="btn-upload-docs">
            {isUploading ? 'Uploading...' : 'Select Files'}
         </Button>
      </div>
    </Card>
  );
};

const WaitingRoom = ({ title, message, icon: Icon }) => (
  <Card className="text-center py-12">
    <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
      <Icon size={32} className="text-blue-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
    <p className="text-gray-600 max-w-md mx-auto mb-8">{message}</p>
    <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm text-yellow-800 inline-block mx-auto">
      <div className="flex items-center gap-2">
        <AlertCircle size={16} />
        <span>Waiting for external system event...</span>
      </div>
    </div>
  </Card>
);

const OfferReview = ({ data, nextStage }) => (
  <Card title="Loan Approved!" subtitle="Review your final terms below.">
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-end border-b border-green-200 pb-4 mb-4">
        <div>
          <p className="text-sm text-green-800 font-medium">Approved Amount</p>
          <p className="text-3xl font-bold text-green-900">${parseInt(data.loanAmount).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-green-800 font-medium">Interest Rate</p>
          <p className="text-xl font-bold text-green-900">5.4% APR</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm text-green-900">
        <div>Term Length: <strong>60 Months</strong></div>
        <div>Monthly Payment: <strong>$950/mo</strong></div>
      </div>
    </div>
    <div className="flex justify-end gap-3">
      <Button variant="secondary">Download Terms</Button>
      <Button onClick={() => nextStage(STAGES.CLOSING, "Terms Accepted")} id="btn-accept-offer">
        Accept Terms
      </Button>
    </div>
  </Card>
);

const ClosingView = ({ nextStage }) => {
  const handleSubmit = (e) => {
      e.preventDefault();
      // Ensure the script can see the transition
      nextStage(STAGES.DISBURSED, "Loan Closed - Final Submission");
  };

  return (
    <Card title="Final Closing" subtitle="Please sign your documents electronically.">
      {/* WRAP IN FORM FOR ANALYTICS AUTO-TRACKING */}
      <form onSubmit={handleSubmit}> 
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" className="h-5 w-5 text-blue-600" />
            <span className="text-gray-700">I agree to the Truth in Lending Disclosure</span>
          </div>
          <div className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" className="h-5 w-5 text-blue-600" />
            <span className="text-gray-700">I agree to the Promissory Note</span>
          </div>
        </div>
        <Button type="submit" className="w-full" id="btn-sign-close">
          Sign & Finalize
        </Button>
      </form>
    </Card>
  );
};

const SuccessView = () => (
  <Card className="text-center py-12 bg-gradient-to-b from-white to-green-50">
    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
      <CheckCircle size={40} className="text-green-600" />
    </div>
    <h2 className="text-3xl font-bold text-gray-900 mb-2">Funds Disbursed!</h2>
    <p className="text-gray-600 mb-8">The funds have been sent to your account. Thank you for choosing SwiftLoan.</p>
    <Button variant="secondary" onClick={() => window.location.reload()}>Return Home</Button>
  </Card>
);

const DisqualifiedView = () => (
    <Card className="text-center py-12 bg-gradient-to-b from-white to-red-50">
      <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <XOctagon size={40} className="text-red-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Application Disqualified</h2>
      <p className="text-gray-600 max-w-md mx-auto mb-8">
        We regret to inform you that your application could not be approved due to insufficient documentation. 
        You may reapply in 90 days.
      </p>
      <Button variant="secondary" onClick={() => window.location.reload()}>Try New Application</Button>
    </Card>
);

// --- Main Application ---

export default function LoanProcessDemo() {
  const [data, setData] = useState(INITIAL_STATE);
  const [showAdmin, setShowAdmin] = useState(true);

  // --- HEAP HELPER FUNCTION ---
  const identifyUser = (email, name, id) => {
    if (window.heap && typeof window.heap.identify === 'function') {
        window.heap.identify(email);
        window.heap.addUserProperties({
            name: name,
            loan_app_id: id,
            initial_income: data.income 
        });
        console.log(`[Heap] Identified user: ${email} (ID: ${id})`);
    } else {
        console.warn("[Heap] window.heap.identify() skipped: Heap object not found.");
    }
  };
  // --- END HEAP HELPER FUNCTION ---


  useEffect(() => {
    const saved = localStorage.getItem('swiftloan_demo_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed);
      } catch (e) {
        console.error("State load failed", e);
      }
    } else {
      setData(prev => ({ ...prev, id: `LN-${Math.floor(Math.random() * 10000)}` }));
    }
  }, []);

  useEffect(() => {
    if (data.id) {
      localStorage.setItem('swiftloan_demo_state', JSON.stringify(data));
    }
  }, [data]);

  // Sync URL with Stage for Analytics
  useEffect(() => {
    const slug = STAGE_URL_SLUGS[data.status];
    
    if (slug && !window.location.protocol.startsWith('blob')) {
      const newUrl = `${window.location.pathname}?step=${slug}`;
      try {
        window.history.replaceState(null, '', newUrl);
      } catch (e) {
        console.warn("Analytics URL update skipped (Sandbox Environment)");
      }
    }
  }, [data.status]);

  // --- Logic Helpers ---

  const updateData = (key, value) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const changeStage = (newStage, actionLabel) => {
    setData(prev => ({
      ...prev,
      status: newStage,
      history: [...prev.history, {
        timestamp: prev.currentSimulatedDate,
        realTimestamp: new Date().toISOString(),
        stage: newStage,
        action: 'STAGE_CHANGE',
        note: actionLabel
      }]
    }));
  };

  const advanceTime = (days) => {
    const current = new Date(data.currentSimulatedDate);
    current.setDate(current.getDate() + days);
    
    setData(prev => ({
      ...prev,
      currentSimulatedDate: current.toISOString(),
      history: [...prev.history, {
        timestamp: current.toISOString(),
        realTimestamp: new Date().toISOString(),
        stage: prev.status,
        action: 'TIME_TRAVEL',
        note: `Advanced ${days} days`
      }]
    }));
  };

  const resetDemo = () => {
    // ANALYTICS HYGIENE: Reset identity before clearing state
    if (window.heap && typeof window.heap.resetIdentity === 'function') {
        window.heap.resetIdentity(); 
        console.log("[Heap] Identity reset for new anonymous session.");
    } else {
        console.warn("[Heap] window.heap.resetIdentity() skipped: Heap object not found.");
    }
    
    localStorage.removeItem('swiftloan_demo_state');
    window.location.reload();
  };

  // --- Render Logic ---

  const renderStage = () => {
    switch (data.status) {
      case STAGES.APPLICATION:
        // Pass the new identifyUser function down to the form
        return <ApplicationForm data={data} updateData={updateData} nextStage={changeStage} identifyUser={identifyUser} />;
      case STAGES.PRE_APPROVAL:
        setTimeout(() => {
          if (data.status === STAGES.PRE_APPROVAL) changeStage(STAGES.DOCUMENTS, "System Pre-Check Passed");
        }, 2000);
        return <WaitingRoom title="Analyzing Eligibility..." message="We are running a soft credit check." icon={RefreshCw} />;
      case STAGES.DOCUMENTS:
        return <DocumentsView nextStage={changeStage} />;
      case STAGES.UNDERWRITING:
        return <WaitingRoom title="Underwriting Review" message="Our team is reviewing your documents. This usually takes 3-5 business days." icon={Shield} />;
      case STAGES.APPROVAL_OFFER:
        return <OfferReview data={data} nextStage={changeStage} />;
      case STAGES.CLOSING:
        return <ClosingView nextStage={changeStage} />;
      case STAGES.DISBURSED:
        return <SuccessView />;
      case STAGES.DISQUALIFIED:
        return <DisqualifiedView />;
      default:
        return <div>Unknown Stage</div>;
    }
  };

  const progressIndex = STAGE_ORDER.indexOf(data.status);

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col md:flex-row">
      
      {/* --- Admin / Analytics Simulator Panel (Left Side) --- */}
      {showAdmin && (
        <aside className="w-full md:w-80 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col h-screen sticky top-0 overflow-y-auto border-r border-slate-800 shadow-2xl z-50 flex-shrink-0">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-2 text-white font-bold text-xl mb-1">
              <Database size={20} className="text-blue-500" />
              <span>Data Layer</span>
            </div>
            <p className="text-xs text-slate-500">Simulate Server & Time Events</p>
          </div>

          <div className="p-6 space-y-8 flex-1">
            {/* Time Travel Controls */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <Clock size={14} /> Time Simulation
              </h3>
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="text-sm text-white mb-2 font-mono">
                  {new Date(data.currentSimulatedDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="admin" onClick={() => advanceTime(1)}>+ 1 Day</Button>
                  <Button variant="admin" onClick={() => advanceTime(5)}>+ 5 Days</Button>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-tight">
                  Advances the `timestamp` property in the JSON event history to test funnel drop-off over time.
                </p>
              </div>
            </div>

            {/* State Force Controls */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <Settings size={14} /> Force Server State
              </h3>
              <div className="space-y-2">
                <Button variant="admin" className="w-full justify-start" onClick={() => changeStage(STAGES.UNDERWRITING, "Admin Force: Underwriting")}>
                   Force: To Underwriting
                </Button>
                <Button variant="admin" className="w-full justify-start" onClick={() => changeStage(STAGES.APPROVAL_OFFER, "Admin Force: Approved")}>
                   Force: Server Approves
                </Button>
                <Button variant="admin" className="w-full justify-start text-red-300 hover:text-white hover:bg-red-900" onClick={resetDemo}>
                   <RefreshCw size={14} /> Reset Demo
                </Button>
              </div>
            </div>

            {/* JSON Preview */}
            <div>
               <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">User Object (JSON)</h3>
               <div className="bg-black rounded p-3 overflow-x-auto border border-slate-800">
                 <pre className="text-[10px] font-mono text-green-400">
                   {JSON.stringify({
                     id: data.id,
                     status: data.status,
                     currDate: data.currentSimulatedDate,
                     historyCount: data.history.length
                   }, null, 2)}
                 </pre>
                 <div className="mt-2 pt-2 border-t border-slate-800">
                    <p className="text-[10px] text-slate-400">Last Event:</p>
                    <pre className="text-[10px] font-mono text-blue-300">
                        {data.history.length > 0 ? JSON.stringify(data.history[data.history.length - 1], null, 2) : 'None'}
                    </pre>
                 </div>
               </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-slate-800 text-xs text-center text-slate-600">
            SwiftLoan Demo v1.0
          </div>
        </aside>
      )}

      {/* --- Main Application Content (Right Side) --- */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        
        {/* App Header */}
        <header className="bg-white shadow-sm z-40 px-8 py-4 flex justify-between items-center sticky top-0 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <DollarSign size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SwiftLoan</h1>
              <p className="text-xs text-gray-500">Secure Application Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">Application ID: {data.id}</p>
                <Badge status={data.status} />
             </div>
             <button 
               onClick={() => setShowAdmin(!showAdmin)} 
               className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded"
             >
               <Settings size={20} />
             </button>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="px-4 md:px-8 py-6 bg-white border-b border-gray-200 overflow-x-auto flex-shrink-0">
          <div className="flex items-center w-full">
            {STAGE_ORDER.map((stage, index) => {
              const isActive = index === progressIndex;
              const isCompleted = index < progressIndex;
              
              const isFinalStage = index === STAGE_ORDER.length - 1;
              const isFinished = data.status === STAGES.DISBURSED;
              const showCheck = isCompleted || (isFinalStage && isFinished);

              let bubbleClass = "bg-gray-100 border-gray-300 text-gray-400";
              if (showCheck) {
                 bubbleClass = isFinalStage ? "bg-green-600 border-green-600 text-white" : "bg-blue-600 border-blue-600 text-white";
              } else if (isActive) {
                 bubbleClass = "bg-white border-blue-600 text-blue-600";
              }

              return (
                <div key={stage} className="flex items-center flex-1 last:flex-none">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 flex-shrink-0 ${bubbleClass}`}>
                    {showCheck ? <CheckCircle size={14} /> : index + 1}
                  </div>
                  {index !== STAGE_ORDER.length - 1 && (
                     <div className={`h-1 flex-1 mx-1 md:mx-2 rounded ${isCompleted ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between w-full mt-2 text-[10px] md:text-xs text-gray-500 font-medium uppercase tracking-wide">
             <span>Apply</span>
             <span>Check</span>
             <span>Docs</span>
             <span>Review</span>
             <span>Offer</span>
             <span>Sign</span>
             <span>Cash</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
          {renderStage()}

          {/* Context for the Demo User */}
          <div className="mt-12 p-4 bg-blue-50 rounded border border-blue-100 text-sm text-blue-800">
             <h4 className="font-bold flex items-center gap-2 mb-2"><Briefcase size={16} /> Demo Instructions</h4>
             <ul className="list-disc pl-5 space-y-1 opacity-80">
                <li>This app simulates a 15-30 day process.</li>
                <li>Use the <strong>Data Layer</strong> panel on the left to simulate time passing between steps.</li>
                <li>Some steps (like Underwriting) are "Server Side" and require you to click "Force: Server Approves" in the admin panel to proceed.</li>
                <li>All actions update the <code>history</code> array in the JSON object with timestamps.</li>
             </ul>
          </div>
        </div>

      </main>
    </div>
  );
}