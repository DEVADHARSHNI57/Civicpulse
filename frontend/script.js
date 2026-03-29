// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════
let USERS = [
  { email:'jane@example.com', name:'Jane Doe', mobile:'+91 98765 43210', pw:'Jane@123', role:'civilian', address:'Ward 12, Sector 4', googleUser:false },
  { email:'john@example.com', name:'John Smith', mobile:'+91 91234 56789', pw:'John@123', role:'civilian', address:'', googleUser:false },
];
const AUTH_USERS = [
  { id:'ADMIN-NORTH-01',   pw:'north123',   role:'admin', name:'North Zone Admin',   region:'NORTH'   },
  { id:'ADMIN-SOUTH-01',   pw:'south123',   role:'admin', name:'South Zone Admin',   region:'SOUTH'   },
  { id:'ADMIN-EAST-01',    pw:'east123',    role:'admin', name:'East Zone Admin',    region:'EAST'    },
  { id:'ADMIN-WEST-01',    pw:'west123',    role:'admin', name:'West Zone Admin',    region:'WEST'    },
  { id:'ADMIN-CENTRAL-01', pw:'central123', role:'admin', name:'Central Zone Admin', region:'CENTRAL' },
  { id:'ROADS-AUTH-01',    pw:'roads123',   role:'authority', name:'Roads Authority',       dept:'Roads Dept.'       },
  { id:'ELEC-AUTH-01',     pw:'elec123',    role:'authority', name:'Electricity Authority', dept:'Electricity Dept.' },
];

// Shared complaint store (simulates backend — admin can read this too)
let COMPLAINTS = {
  'CP-1042': {
    id:'CP-1042', emoji:'🚧', title:'Pothole on Main Street',
    cat:'Roads & Potholes', priority:'High', loc:'Main St. & 3rd Ave',
    date:'Mar 5, 2026', dept:'Roads Dept.', status:'In Progress',
    reportedBy:'jane@example.com',
    desc:'A large pothole (≈60cm) near Main St. & 3rd Ave intersection. Vehicles swerving dangerously.',
    photos:[],
    feedback:null,
    timeline:[
      { title:'📝 Issue Submitted', desc:'Report received and logged.', time:'Mar 5 · 9:14 AM', done:true },
      { title:'👀 Reviewed & Assigned', desc:'Admin assigned to Roads Department.', time:'Mar 5 · 2:30 PM', done:true, remark:'Verified on-site. Roads team notified.' },
      { title:'🔍 Site Inspection', desc:'Inspector visited, confirmed severity.', time:'Mar 6 · 10:00 AM', done:true },
      { title:'🔧 Repair Work', desc:'Scheduled Mar 9 — materials in transit.', time:'Pending', done:false, current:true },
      { title:'✅ Resolved & Closed', desc:'Awaiting completion.', time:'Pending', done:false },
    ],
    progress:60,
  },
  'CP-1041': {
    id:'CP-1041', emoji:'💡', title:'Street Light Outage — Park Road',
    cat:'Street Lighting', priority:'Medium', loc:'Park Road, Sector 4',
    date:'Mar 4, 2026', dept:'Electricity Dept.', status:'Open',
    reportedBy:'jane@example.com',
    desc:'3 consecutive street lights on Park Road have been out for 5 days. Creates safety risk at night.',
    photos:[],
    feedback:null,
    timeline:[
      { title:'📝 Issue Submitted', desc:'Report received and logged.', time:'Mar 4 · 3:00 PM', done:true },
      { title:'👀 Reviewed & Assigned', desc:'Assigned to Electricity Department.', time:'Mar 5 · 9:00 AM', done:true, remark:'Assigned to Electricity Dept. for inspection.' },
      { title:'🔍 Inspection', desc:'Awaiting visit.', time:'Pending', done:false, current:true },
      { title:'⚡ Repair Work', desc:'Pending inspection outcome.', time:'Pending', done:false },
      { title:'✅ Resolved', desc:'Pending.', time:'Pending', done:false },
    ],
    progress:35,
  },
  'CP-1039': {
    id:'CP-1039', emoji:'🌳', title:'Broken Park Bench — Central Garden',
    cat:'Parks & Recreation', priority:'Low', loc:'Central Garden',
    date:'Mar 1, 2026', dept:'Parks Dept.', status:'Resolved',
    reportedBy:'jane@example.com',
    desc:'Wooden park bench near the fountain is broken. Splinters causing injuries to children.',
    photos:[],
    feedback:null,
    timeline:[
      { title:'📝 Issue Submitted', desc:'Report received.', time:'Mar 1 · 11:00 AM', done:true },
      { title:'👀 Reviewed & Assigned', desc:'Assigned to Parks Department.', time:'Mar 2 · 9:00 AM', done:true },
      { title:'🔍 Inspection', desc:'Parks officer inspected.', time:'Mar 3 · 2:00 PM', done:true },
      { title:'🔧 Repair Work', desc:'New bench installed.', time:'Mar 5 · 10:00 AM', done:true, remark:'Bench replaced with new weatherproof unit.' },
      { title:'✅ Resolved', desc:'Marked resolved by Parks Dept.', time:'Mar 6 · 4:00 PM', done:true },
    ],
    progress:100,
  },
};

// Seeded notifications
let NOTIFICATIONS = [
  { id:'n1', icon:'🔧', title:'⚙️ Repair Scheduled — Issue #CP-1042', text:'Roads Department has scheduled repair work for <strong>March 9</strong>. You\'ll receive confirmation once completed.', time:'🕑 2 hours ago', read:false, forUser:'jane@example.com' },
  { id:'n2', icon:'✅', title:'✅ Issue Resolved — #CP-1039 Broken Park Bench', text:'Parks Department has resolved your issue. Please <strong>rate the resolution</strong> on your dashboard.', time:'🕔 5 hours ago', read:false, forUser:'jane@example.com' },
  { id:'n3', icon:'👀', title:'👀 Issue Assigned — #CP-1041 Street Light', text:'Your report has been reviewed by Admin and <strong>assigned to the Electricity Department</strong>.', time:'🕙 Yesterday, 11:00 AM', read:false, forUser:'jane@example.com' },
  { id:'n4', icon:'🚨', title:'🚨 Escalated — Issue #CP-1040', text:'Issue #CP-1040 has been escalated to <strong>Critical</strong> status by Admin. Sanitation team is now prioritising it.', time:'📅 Mar 3, 2026', read:true, forUser:'jane@example.com' },
  { id:'n5', icon:'🎉', title:'🎉 Welcome to CivicPulse!', text:'Thanks for joining! Your reports help make our community better. Submit your first issue to get started.', time:'📅 Mar 1, 2026', read:true, forUser:'jane@example.com' },
];

let currentUser = null;
let civTab = 'signin';
let currentRole = 'civilian';
let currentLang = 'en';
let selectedFeedback = null;
let feedbackIssueId = null;
let idCounter = 1043;
let uploadedPhotos = [];

// ═══════════════════════════════════════════
// TRANSLATIONS — Full dashboard coverage
// ═══════════════════════════════════════════
const LANG_LABELS = {
  en:'🇺🇸 English', hi:'🇮🇳 हिन्दी', ta:'🇮🇳 தமிழ்', te:'🇮🇳 తెలుగు', kn:'🇮🇳 ಕನ್ನಡ'
};

const T = {
  en:{
    tagline:'Report and Track Community Issues',
    civilian:'Civilian', civilian_desc:'Report issues',
    admin:'Admin', admin_desc:'Manage issues',
    authority:'Authority', authority_desc:'Resolve issues',
    signin:'✨ Sign In', signup:'🌱 Sign Up',
    forgot_pw:'Forgot Password?', login_btn:'🚀 Login',
    or_continue:'or continue with', continue_google:'Continue with Google',
    create_account:'🌟 Create Account',
    nav_section:'Navigation', nav_overview:'Overview', nav_report:'Report Issue',
    nav_tracking:'Track Status', nav_notifications:'Notifications', nav_profile:'My Profile',
    signout:'Sign Out', new_report:'➕ New Report',
    welcome_back:'Welcome back', you_have:'You have', updates_on:'updates on your reports.',
    total_reported:'Total Reported', in_progress:'In Progress', resolved:'Resolved', awaiting:'Awaiting Review',
    active_work:'🔧 Active work', pending_lbl:'🕐 Pending',
    my_recent_reports:'🗂️ My Recent Reports', view_all:'View all →',
    no_issues_yet:'No issues reported yet. Click ➕ New Report to get started!',
    submit_new_issue:'📋 Submit a New Issue',
    issue_title_lbl:'📌 Issue Title *', category_lbl:'🗂️ Category *', priority_lbl:'🚦 Priority',
    description_lbl:'📝 Description *', location_lbl:'📍 Location *',
    your_name_lbl:'👤 Your Name', contact_lbl:'📧 Contact',
    photo_lbl:'📸 Photo Evidence', upload_txt:'Drag & drop photos or click to browse',
    select_cat:'Select category…', submit_report_btn:'🚀 Submit Report', cancel:'Cancel',
    click_detect:'Click to detect your location',
    my_complaints:'🗂️ My Complaints', no_reports_yet:'No complaints yet. Submit your first issue!',
    notifications_title:'🔔 Notifications', mark_all_read:'Mark all as read ✓',
    civilian_badge:'🏠 Civilian · Citizen Reporter',
    email_lbl:'📧 Email Address', email_locked:'🔒 Email cannot be changed after registration',
    mobile_lbl:'📱 Mobile Number', address_lbl:'📍 Default Area / Ward', lang_pref_lbl:'🌐 Preferred Language',
    save_changes:'💾 Save Changes', change_pw:'🔑 Change Password',
    signed_with_google:'Signed in with Google',
    in_progress_badge:'⚙️ In Progress', open_badge:'⏳ Open', resolved_badge:'✅ Resolved',
    resolution_progress:'📊 Resolution Progress', timeline_lbl:'🗓️ Timeline',
    details_lbl:'📋 Details', actions_lbl:'⚡ Quick Actions',
    send_reminder:'📬 Send Reminder', share_report:'🔗 Share Report', escalate:'🚨 Escalate Issue',
    issue_id_lbl:'🪪 Issue ID', category_col:'🗂️ Category', priority_col:'🚦 Priority',
    location_col:'📍 Location', assigned_col:'🔧 Assigned To', status_col:'📊 Status',
    track_btn:'📍 Track This Issue', close_btn:'Close',
    feedback_pending:'⭐ Rate Resolution',
    fb_satisfied:'Satisfied — Issue fully resolved',
    fb_partial:'Partially Satisfied — Some improvement',
    fb_unsatisfied:'Not Satisfied — Issue still exists',
    submit_feedback:'📤 Submit Feedback',
    profile_saved:'✅ Profile saved successfully!',
    report_submitted:'🚀 Report submitted successfully!',
  },
  hi:{
    tagline:'सामुदायिक समस्याएं रिपोर्ट करें और ट्रैक करें',
    civilian:'नागरिक', civilian_desc:'समस्याएं दर्ज करें',
    admin:'व्यवस्थापक', admin_desc:'समस्याएं प्रबंधित करें',
    authority:'प्राधिकरण', authority_desc:'समस्याएं हल करें',
    signin:'✨ साइन इन', signup:'🌱 साइन अप',
    forgot_pw:'पासवर्ड भूल गए?', login_btn:'🚀 लॉगिन',
    or_continue:'या जारी रखें', continue_google:'Google से जारी रखें',
    create_account:'🌟 खाता बनाएं',
    nav_section:'नेविगेशन', nav_overview:'अवलोकन', nav_report:'समस्या दर्ज करें',
    nav_tracking:'स्थिति ट्रैक करें', nav_notifications:'सूचनाएं', nav_profile:'मेरी प्रोफ़ाइल',
    signout:'साइन आउट', new_report:'➕ नई रिपोर्ट',
    welcome_back:'वापसी पर स्वागत', you_have:'आपके पास', updates_on:'रिपोर्ट पर अपडेट हैं।',
    total_reported:'कुल दर्ज', in_progress:'प्रगति में', resolved:'हल हुई', awaiting:'समीक्षा प्रतीक्षित',
    active_work:'🔧 कार्य जारी', pending_lbl:'🕐 लंबित',
    my_recent_reports:'🗂️ मेरी हालिया रिपोर्ट', view_all:'सभी देखें →',
    no_issues_yet:'अभी तक कोई समस्या दर्ज नहीं की गई।',
    submit_new_issue:'📋 नई समस्या दर्ज करें',
    issue_title_lbl:'📌 समस्या का शीर्षक *', category_lbl:'🗂️ श्रेणी *', priority_lbl:'🚦 प्राथमिकता',
    description_lbl:'📝 विवरण *', location_lbl:'📍 स्थान *',
    your_name_lbl:'👤 आपका नाम', contact_lbl:'📧 संपर्क',
    photo_lbl:'📸 फोटो साक्ष्य', upload_txt:'फोटो खींचें या क्लिक करें',
    select_cat:'श्रेणी चुनें…', submit_report_btn:'🚀 रिपोर्ट जमा करें', cancel:'रद्द करें',
    click_detect:'अपना स्थान पहचानने के लिए क्लिक करें',
    my_complaints:'🗂️ मेरी शिकायतें', no_reports_yet:'अभी तक कोई शिकायत नहीं।',
    notifications_title:'🔔 सूचनाएं', mark_all_read:'सभी पढ़ा हुआ चिह्नित करें ✓',
    civilian_badge:'🏠 नागरिक · नागरिक रिपोर्टर',
    email_lbl:'📧 ईमेल पता', email_locked:'🔒 पंजीकरण के बाद ईमेल नहीं बदला जा सकता',
    mobile_lbl:'📱 मोबाइल नंबर', address_lbl:'📍 डिफ़ॉल्ट क्षेत्र / वार्ड', lang_pref_lbl:'🌐 पसंदीदा भाषा',
    save_changes:'💾 परिवर्तन सहेजें', change_pw:'🔑 पासवर्ड बदलें',
    signed_with_google:'Google से साइन इन किया',
    in_progress_badge:'⚙️ प्रगति में', open_badge:'⏳ खुला', resolved_badge:'✅ हल हुआ',
    resolution_progress:'📊 समाधान प्रगति', timeline_lbl:'🗓️ समयरेखा',
    details_lbl:'📋 विवरण', actions_lbl:'⚡ त्वरित क्रियाएं',
    send_reminder:'📬 अनुस्मारक भेजें', share_report:'🔗 रिपोर्ट साझा करें', escalate:'🚨 मुद्दा बढ़ाएं',
    issue_id_lbl:'🪪 मुद्दा ID', category_col:'🗂️ श्रेणी', priority_col:'🚦 प्राथमिकता',
    location_col:'📍 स्थान', assigned_col:'🔧 सौंपा गया', status_col:'📊 स्थिति',
    track_btn:'📍 इस मुद्दे को ट्रैक करें', close_btn:'बंद करें',
    feedback_pending:'⭐ समाधान रेट करें',
    fb_satisfied:'संतुष्ट — मुद्दा पूरी तरह हल', fb_partial:'आंशिक संतुष्ट', fb_unsatisfied:'असंतुष्ट — मुद्दा अभी भी मौजूद',
    submit_feedback:'📤 प्रतिक्रिया जमा करें',
    profile_saved:'✅ प्रोफ़ाइल सफलतापूर्वक सहेजी गई!',
    report_submitted:'🚀 रिपोर्ट सफलतापूर्वक जमा की गई!',
  },
  ta:{
    tagline:'சமூக பிரச்சனைகளை புகாரளிக்கவும் மற்றும் கண்காணிக்கவும்',
    civilian:'குடிமகன்', civilian_desc:'பிரச்சனைகளை அறிவிக்கவும்',
    admin:'நிர்வாகி', admin_desc:'பிரச்சனைகளை நிர்வகிக்கவும்',
    authority:'அதிகாரம்', authority_desc:'பிரச்சனைகளை தீர்க்கவும்',
    signin:'✨ உள்நுழை', signup:'🌱 பதிவு செய்',
    forgot_pw:'கடவுச்சொல் மறந்துவிட்டதா?', login_btn:'🚀 உள்நுழைவு',
    or_continue:'அல்லது தொடரவும்', continue_google:'Google மூலம் தொடரவும்',
    create_account:'🌟 கணக்கை உருவாக்கவும்',
    nav_section:'வழிசெலுத்தல்', nav_overview:'மேலோட்டம்', nav_report:'பிரச்சனை தெரிவிக்கவும்',
    nav_tracking:'நிலை கண்காணி', nav_notifications:'அறிவிப்புகள்', nav_profile:'என் சுயவிவரம்',
    signout:'வெளியேறு', new_report:'➕ புதிய அறிக்கை',
    welcome_back:'மீண்டும் வரவேற்கிறோம்', you_have:'உங்களிடம்', updates_on:'அறிக்கைகளில் புதுப்பிப்புகள் உள்ளன.',
    total_reported:'மொத்தம் தெரிவித்தவை', in_progress:'நடவடிக்கையில்', resolved:'தீர்க்கப்பட்டது', awaiting:'மதிப்பாய்வு எதிர்பார்ப்பு',
    active_work:'🔧 செயலில் உள்ளது', pending_lbl:'🕐 நிலுவையில்',
    my_recent_reports:'🗂️ என் சமீபத்திய அறிக்கைகள்', view_all:'அனைத்தும் காண்க →',
    no_issues_yet:'இன்னும் எந்த பிரச்சனையும் தெரிவிக்கப்படவில்லை.',
    submit_new_issue:'📋 புதிய பிரச்சனை தெரிவிக்கவும்',
    issue_title_lbl:'📌 பிரச்சனை தலைப்பு *', category_lbl:'🗂️ வகை *', priority_lbl:'🚦 முன்னுரிமை',
    description_lbl:'📝 விளக்கம் *', location_lbl:'📍 இடம் *',
    your_name_lbl:'👤 உங்கள் பெயர்', contact_lbl:'📧 தொடர்பு',
    photo_lbl:'📸 புகைப்பட சான்று', upload_txt:'புகைப்படங்களை இழுக்கவும் அல்லது கிளிக் செய்யவும்',
    select_cat:'வகை தேர்ந்தெடு…', submit_report_btn:'🚀 அறிக்கை சமர்ப்பி', cancel:'ரத்துசெய்',
    click_detect:'உங்கள் இடத்தை கண்டறிய கிளிக் செய்யவும்',
    my_complaints:'🗂️ என் புகார்கள்', no_reports_yet:'இன்னும் புகார்கள் இல்லை.',
    notifications_title:'🔔 அறிவிப்புகள்', mark_all_read:'அனைத்தையும் படித்ததாக குறி ✓',
    civilian_badge:'🏠 குடிமகன் · குடிமை நிருபர்',
    email_lbl:'📧 மின்னஞ்சல் முகவரி', email_locked:'🔒 பதிவுக்குப் பிறகு மின்னஞ்சல் மாற்ற இயலாது',
    mobile_lbl:'📱 கைபேசி எண்', address_lbl:'📍 இயல்புநிலை பகுதி / வார்டு', lang_pref_lbl:'🌐 விருப்பமான மொழி',
    save_changes:'💾 மாற்றங்களை சேமி', change_pw:'🔑 கடவுச்சொல் மாற்று',
    signed_with_google:'Google மூலம் உள்நுழைந்தீர்கள்',
    in_progress_badge:'⚙️ நடவடிக்கையில்', open_badge:'⏳ திறந்தது', resolved_badge:'✅ தீர்க்கப்பட்டது',
    resolution_progress:'📊 தீர்வு முன்னேற்றம்', timeline_lbl:'🗓️ காலக்கெடு',
    details_lbl:'📋 விவரங்கள்', actions_lbl:'⚡ விரைவு செயல்கள்',
    send_reminder:'📬 நினைவூட்டல் அனுப்பு', share_report:'🔗 அறிக்கை பகிர்', escalate:'🚨 பிரச்சனை அதிகரி',
    issue_id_lbl:'🪪 பிரச்சனை ID', category_col:'🗂️ வகை', priority_col:'🚦 முன்னுரிமை',
    location_col:'📍 இடம்', assigned_col:'🔧 ஒதுக்கப்பட்டது', status_col:'📊 நிலை',
    track_btn:'📍 இந்த பிரச்சனையை கண்காணி', close_btn:'மூடு',
    feedback_pending:'⭐ தீர்வை மதிப்பிடவும்',
    fb_satisfied:'திருப்தி — பிரச்சனை முழுமையாக தீர்க்கப்பட்டது', fb_partial:'பகுதி திருப்தி', fb_unsatisfied:'திருப்தியற்றது',
    submit_feedback:'📤 கருத்து சமர்ப்பி',
    profile_saved:'✅ சுயவிவரம் வெற்றிகரமாக சேமிக்கப்பட்டது!',
    report_submitted:'🚀 அறிக்கை வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!',
  },
  te:{
    tagline:'సమాజ సమస్యలను నివేదించండి మరియు ట్రాక్ చేయండి',
    civilian:'పౌరుడు', civilian_desc:'సమస్యలను నివేదించండి',
    admin:'అడ్మిన్', admin_desc:'సమస్యలను నిర్వహించండి',
    authority:'అధికారం', authority_desc:'సమస్యలను పరిష్కరించండి',
    signin:'✨ సైన్ ఇన్', signup:'🌱 సైన్ అప్',
    forgot_pw:'పాస్‌వర్డ్ మర్చిపోయారా?', login_btn:'🚀 లాగిన్',
    or_continue:'లేదా కొనసాగించండి', continue_google:'Google తో కొనసాగించండి',
    create_account:'🌟 ఖాతా సృష్టించండి',
    nav_section:'నావిగేషన్', nav_overview:'అవలోకనం', nav_report:'సమస్యను నివేదించండి',
    nav_tracking:'స్థితి ట్రాక్ చేయండి', nav_notifications:'నోటిఫికేషన్లు', nav_profile:'నా ప్రొఫైల్',
    signout:'సైన్ అవుట్', new_report:'➕ కొత్త నివేదిక',
    welcome_back:'తిరిగి స్వాగతం', you_have:'మీకు', updates_on:'నివేదికలపై నవీకరణలు ఉన్నాయి.',
    total_reported:'మొత్తం నివేదించినవి', in_progress:'పురోగతిలో', resolved:'పరిష్కరించబడింది', awaiting:'సమీక్ష నిరీక్షణలో',
    active_work:'🔧 చురుకైన పని', pending_lbl:'🕐 పెండింగ్',
    my_recent_reports:'🗂️ నా ఇటీవలి నివేదికలు', view_all:'అన్నీ చూడు →',
    no_issues_yet:'ఇంకా సమస్యలు నివేదించబడలేదు.',
    submit_new_issue:'📋 కొత్త సమస్యను నివేదించండి',
    issue_title_lbl:'📌 సమస్య శీర్షిక *', category_lbl:'🗂️ వర్గం *', priority_lbl:'🚦 ప్రాధాన్యత',
    description_lbl:'📝 వివరణ *', location_lbl:'📍 స్థానం *',
    your_name_lbl:'👤 మీ పేరు', contact_lbl:'📧 సంప్రదింపు',
    photo_lbl:'📸 ఫోటో ఆధారం', upload_txt:'ఫోటోలను లాగండి లేదా క్లిక్ చేయండి',
    select_cat:'వర్గం ఎంచుకోండి…', submit_report_btn:'🚀 నివేదిక సమర్పించండి', cancel:'రద్దు',
    click_detect:'మీ స్థానాన్ని గుర్తించడానికి క్లిక్ చేయండి',
    my_complaints:'🗂️ నా ఫిర్యాదులు', no_reports_yet:'ఇంకా ఫిర్యాదులు లేవు.',
    notifications_title:'🔔 నోటిఫికేషన్లు', mark_all_read:'అన్నీ చదివినట్లు గుర్తించు ✓',
    civilian_badge:'🏠 పౌరుడు · సిటిజన్ రిపోర్టర్',
    email_lbl:'📧 ఇమెయిల్ చిరునామా', email_locked:'🔒 నమోదు తర్వాత ఇమెయిల్ మార్చలేరు',
    mobile_lbl:'📱 మొబైల్ నంబర్', address_lbl:'📍 డిఫాల్ట్ ఏరియా / వార్డ్', lang_pref_lbl:'🌐 ప్రాధాన్య భాష',
    save_changes:'💾 మార్పులు సేవ్ చేయి', change_pw:'🔑 పాస్‌వర్డ్ మార్చు',
    signed_with_google:'Google తో సైన్ ఇన్ అయ్యారు',
    in_progress_badge:'⚙️ పురోగతిలో', open_badge:'⏳ తెరచి', resolved_badge:'✅ పరిష్కరించబడింది',
    resolution_progress:'📊 పరిష్కార పురోగతి', timeline_lbl:'🗓️ కాలక్రమం',
    details_lbl:'📋 వివరాలు', actions_lbl:'⚡ త్వరిత చర్యలు',
    send_reminder:'📬 రిమైండర్ పంపు', share_report:'🔗 నివేదికను షేర్ చేయి', escalate:'🚨 సమస్య ఎస్కలేట్ చేయి',
    issue_id_lbl:'🪪 సమస్య ID', category_col:'🗂️ వర్గం', priority_col:'🚦 ప్రాధాన్యత',
    location_col:'📍 స్థానం', assigned_col:'🔧 అప్పగించారు', status_col:'📊 స్థితి',
    track_btn:'📍 ఈ సమస్యను ట్రాక్ చేయి', close_btn:'మూసివేయి',
    feedback_pending:'⭐ పరిష్కారాన్ని రేటు చేయి',
    fb_satisfied:'సంతృప్తి — సమస్య పూర్తిగా పరిష్కరించబడింది', fb_partial:'పాక్షిక సంతృప్తి', fb_unsatisfied:'అసంతృప్తి',
    submit_feedback:'📤 అభిప్రాయం సమర్పించు',
    profile_saved:'✅ ప్రొఫైల్ విజయవంతంగా సేవ్ చేయబడింది!',
    report_submitted:'🚀 నివేదిక విజయవంతంగా సమర్పించబడింది!',
  },
  kn:{
    tagline:'ಸಮುದಾಯ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಿ ಮತ್ತು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    civilian:'ನಾಗರಿಕ', civilian_desc:'ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಿ',
    admin:'ಆಡಳಿತ', admin_desc:'ಸಮಸ್ಯೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ',
    authority:'ಅಧಿಕಾರ', authority_desc:'ಸಮಸ್ಯೆಗಳನ್ನು ಪರಿಹರಿಸಿ',
    signin:'✨ ಸೈನ್ ಇನ್', signup:'🌱 ಸೈನ್ ಅಪ್',
    forgot_pw:'ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿದ್ದೀರಾ?', login_btn:'🚀 ಲಾಗಿನ್',
    or_continue:'ಅಥವಾ ಮುಂದುವರಿಯಿರಿ', continue_google:'Google ನೊಂದಿಗೆ ಮುಂದುವರಿಯಿರಿ',
    create_account:'🌟 ಖಾತೆ ರಚಿಸಿ',
    nav_section:'ನ್ಯಾವಿಗೇಷನ್', nav_overview:'ಅವಲೋಕನ', nav_report:'ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ',
    nav_tracking:'ಸ್ಥಿತಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ', nav_notifications:'ಅಧಿಸೂಚನೆಗಳು', nav_profile:'ನನ್ನ ಪ್ರೊಫೈಲ್',
    signout:'ಸೈನ್ ಔಟ್', new_report:'➕ ಹೊಸ ವರದಿ',
    welcome_back:'ಮತ್ತೆ ಸ್ವಾಗತ', you_have:'ನಿಮಗೆ', updates_on:'ವರದಿಗಳ ಮೇಲೆ ನವೀಕರಣಗಳಿವೆ.',
    total_reported:'ಒಟ್ಟು ವರದಿ', in_progress:'ಪ್ರಗತಿಯಲ್ಲಿದೆ', resolved:'ಪರಿಹರಿಸಲಾಗಿದೆ', awaiting:'ಪರಿಶೀಲನೆ ನಿರೀಕ್ಷೆ',
    active_work:'🔧 ಸಕ್ರಿಯ ಕೆಲಸ', pending_lbl:'🕐 ಬಾಕಿ',
    my_recent_reports:'🗂️ ನನ್ನ ಇತ್ತೀಚಿನ ವರದಿಗಳು', view_all:'ಎಲ್ಲ ನೋಡಿ →',
    no_issues_yet:'ಇನ್ನೂ ಯಾವ ಸಮಸ್ಯೆಯೂ ವರದಿಯಾಗಿಲ್ಲ.',
    submit_new_issue:'📋 ಹೊಸ ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ',
    issue_title_lbl:'📌 ಸಮಸ್ಯೆ ಶೀರ್ಷಿಕೆ *', category_lbl:'🗂️ ವರ್ಗ *', priority_lbl:'🚦 ಆದ್ಯತೆ',
    description_lbl:'📝 ವಿವರಣೆ *', location_lbl:'📍 ಸ್ಥಳ *',
    your_name_lbl:'👤 ನಿಮ್ಮ ಹೆಸರು', contact_lbl:'📧 ಸಂಪರ್ಕ',
    photo_lbl:'📸 ಫೋಟೋ ಸಾಕ್ಷ್ಯ', upload_txt:'ಫೋಟೋಗಳನ್ನು ಎಳೆಯಿರಿ ಅಥವಾ ಕ್ಲಿಕ್ ಮಾಡಿ',
    select_cat:'ವರ್ಗ ಆಯ್ಕೆಮಾಡಿ…', submit_report_btn:'🚀 ವರದಿ ಸಲ್ಲಿಸಿ', cancel:'ರದ್ದು',
    click_detect:'ನಿಮ್ಮ ಸ್ಥಳ ಪತ್ತೆ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ',
    my_complaints:'🗂️ ನನ್ನ ದೂರುಗಳು', no_reports_yet:'ಇನ್ನೂ ದೂರುಗಳಿಲ್ಲ.',
    notifications_title:'🔔 ಅಧಿಸೂಚನೆಗಳು', mark_all_read:'ಎಲ್ಲವನ್ನೂ ಓದಿದೆ ✓',
    civilian_badge:'🏠 ನಾಗರಿಕ · ಸಿಟಿಜನ್ ರಿಪೋರ್ಟರ್',
    email_lbl:'📧 ಇಮೇಲ್ ವಿಳಾಸ', email_locked:'🔒 ನೋಂದಣಿ ನಂತರ ಇಮೇಲ್ ಬದಲಾಯಿಸಲಾಗದು',
    mobile_lbl:'📱 ಮೊಬೈಲ್ ಸಂಖ್ಯೆ', address_lbl:'📍 ಡಿಫಾಲ್ಟ್ ಪ್ರದೇಶ / ವಾರ್ಡ್', lang_pref_lbl:'🌐 ಆದ್ಯತಾ ಭಾಷೆ',
    save_changes:'💾 ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ', change_pw:'🔑 ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ',
    signed_with_google:'Google ನಿಂದ ಸೈನ್ ಇನ್ ಆಗಿದ್ದೀರಿ',
    in_progress_badge:'⚙️ ಪ್ರಗತಿಯಲ್ಲಿದೆ', open_badge:'⏳ ತೆರೆದಿದೆ', resolved_badge:'✅ ಪರಿಹರಿಸಲಾಗಿದೆ',
    resolution_progress:'📊 ಪರಿಹಾರ ಪ್ರಗತಿ', timeline_lbl:'🗓️ ಸಮಯರೇಖೆ',
    details_lbl:'📋 ವಿವರಗಳು', actions_lbl:'⚡ ತ್ವರಿತ ಕ್ರಿಯೆಗಳು',
    send_reminder:'📬 ಜ್ಞಾಪನ ಕಳುಹಿಸಿ', share_report:'🔗 ವರದಿ ಹಂಚಿಕೊಳ್ಳಿ', escalate:'🚨 ಸಮಸ್ಯೆ ಹೆಚ್ಚಿಸಿ',
    issue_id_lbl:'🪪 ಸಮಸ್ಯೆ ID', category_col:'🗂️ ವರ್ಗ', priority_col:'🚦 ಆದ್ಯತೆ',
    location_col:'📍 ಸ್ಥಳ', assigned_col:'🔧 ನಿಯೋಜಿಸಲಾಗಿದೆ', status_col:'📊 ಸ್ಥಿತಿ',
    track_btn:'📍 ಈ ಸಮಸ್ಯೆ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ', close_btn:'ಮುಚ್ಚಿ',
    feedback_pending:'⭐ ಪರಿಹಾರ ರೇಟ್ ಮಾಡಿ',
    fb_satisfied:'ತೃಪ್ತಿ — ಸಮಸ್ಯೆ ಸಂಪೂರ್ಣ ಪರಿಹಾರ', fb_partial:'ಭಾಗಶಃ ತೃಪ್ತಿ', fb_unsatisfied:'ಅತೃಪ್ತಿ',
    submit_feedback:'📤 ಪ್ರತಿಕ್ರಿಯೆ ಸಲ್ಲಿಸಿ',
    profile_saved:'✅ ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ!',
    report_submitted:'🚀 ವರದಿ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!',
  }
};

function t(key) { return (T[currentLang] || T.en)[key] || T.en[key] || key; }

// ═══════════════════════════════════════════
// APPLY TRANSLATION — ALL ELEMENTS
// ═══════════════════════════════════════════
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val) el.textContent = val;
  });
  // Panel title
  const pt = document.getElementById('panel-title');
  if (pt && pt.dataset.panelKey) pt.textContent = t(pt.dataset.panelKey);
}

// ═══════════════════════════════════════════
// LANGUAGE
// ═══════════════════════════════════════════
function toggleDashLang() {
  document.getElementById('dashLangDrop').classList.toggle('open');
}

function setLang(code) {
  currentLang = code;
  const label = LANG_LABELS[code] || LANG_LABELS.en;

  // Update button label
  const dl = document.getElementById('dashLangLabel');
  if (dl) dl.textContent = label;

  // Mark active
  document.querySelectorAll('#dashLangDrop .lang-opt').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick') === `setLang('${code}')`);
  });
  document.getElementById('dashLangDrop').classList.remove('open');

  // Sync profile selector
  const pl = document.getElementById('p-lang');
  if (pl) pl.value = code;

  document.documentElement.lang = code;
  applyTranslations();
  // Re-render dynamic content
  renderOverviewIssues();
  renderTrackingTabs();
  renderNotifications();
  showToast(`🌐 ${label} selected`);
}

// ═══════════════════════════════════════════
// ROLE SELECTION
// ═══════════════════════════════════════════
function selectRole(role) {
  currentRole = role;
  ['civilian','admin','authority'].forEach(r => {
    document.getElementById('role-'+r).classList.toggle('selected', r === role);
  });
  if (role === 'civilian') {
    document.getElementById('civilianLogin').style.display = 'block';
    document.getElementById('authLogin').style.display = 'none';
  } else {
    document.getElementById('civilianLogin').style.display = 'none';
    document.getElementById('authLogin').style.display = 'block';
    document.getElementById('auth-badge').textContent = role === 'admin' ? '🛡️ Admin — Official Login' : '🔧 Authority — Official Login';
    document.getElementById('auth-login-btn').textContent = role === 'admin' ? '🔐 Admin Login' : '🔐 Authority Login';
  }
}

// ═══════════════════════════════════════════
// CIVILIAN TABS
// ═══════════════════════════════════════════
function switchCivTab(tab) {
  civTab = tab;
  document.getElementById('siTab').classList.toggle('active', tab === 'signin');
  document.getElementById('suTab').classList.toggle('active', tab === 'signup');
  document.getElementById('civSignin').style.display = tab === 'signin' ? 'block' : 'none';
  document.getElementById('civSignup').style.display = tab === 'signup' ? 'block' : 'none';
}

// ═══════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════
let emailTimer;
function checkCivEmail(inp) {
  clearTimeout(emailTimer);
  emailTimer = setTimeout(() => {
    const v = inp.value.trim().toLowerCase();
    const msg = document.getElementById('ci-id-msg');
    const icon = document.getElementById('ci-id-icon');
    if (!v) { msg.className='fmsg'; icon.innerHTML=''; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setFmsg('ci-id-msg','err','⚠️ Enter a valid email address');
      inp.classList.add('err'); inp.classList.remove('ok');
      icon.innerHTML = xIcon('var(--red)'); return;
    }
    if (USERS.find(u => u.email === v)) {
      setFmsg('ci-id-msg','ok','✅ Account found — welcome back!');
      inp.classList.remove('err'); inp.classList.add('ok');
      icon.innerHTML = checkIcon();
    } else {
      setFmsg('ci-id-msg','warn','⚠️ No account found — please sign up');
      inp.classList.add('err'); inp.classList.remove('ok');
      icon.innerHTML = warnIcon();
    }
  }, 500);
}
function checkNewEmail(inp) {
  clearTimeout(emailTimer);
  emailTimer = setTimeout(() => {
    const v = inp.value.trim().toLowerCase();
    const icon = document.getElementById('su-email-icon');
    if (!v) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setFmsg('su-email-msg','err','⚠️ Invalid email format');
      inp.classList.add('err'); icon.innerHTML=''; return;
    }
    if (USERS.find(u=>u.email===v)) {
      setFmsg('su-email-msg','err','❌ Email already registered. Sign in instead.');
      inp.classList.add('err'); inp.classList.remove('ok');
      icon.innerHTML = xIcon('var(--red)');
    } else {
      setFmsg('su-email-msg','ok','✅ Email is available!');
      inp.classList.remove('err'); inp.classList.add('ok');
      icon.innerHTML = checkIcon();
    }
  }, 500);
}
function checkMobile(inp) {
  const v = inp.value.trim();
  if (!v) { setFmsg('su-mobile-msg','',''); return; }
  if (!/^[+]?[\d\s\-]{10,14}$/.test(v)) {
    setFmsg('su-mobile-msg','err','⚠️ Enter a valid mobile number');
  } else {
    setFmsg('su-mobile-msg','ok','✅ Looks good!');
  }
}
function checkPwStr(inp) {
  const pw = inp.value;
  document.getElementById('pw-bars').style.display = pw ? 'flex' : 'none';
  let s=0;
  if(pw.length>=8)s++; if(/[A-Z]/.test(pw))s++; if(/[0-9]/.test(pw))s++; if(/[^A-Za-z0-9]/.test(pw))s++;
  const cls=['','w','f','g','s'];
  const lbl=['','🔴 Weak','🟡 Fair','🔵 Good','🟢 Strong — great choice!'];
  ['pb1','pb2','pb3','pb4'].forEach((id,i)=>{
    const el=document.getElementById(id); el.className='pw-bar';
    if(i<s) el.classList.add(cls[s]);
  });
  document.getElementById('pw-lbl').textContent = pw ? lbl[s] : '';
}
function checkPwMatch() {
  const p1=document.getElementById('su-pw').value;
  const p2=document.getElementById('su-pw2').value;
  if(!p2) return;
  if(p1===p2){ setFmsg('su-pw2-msg','ok','✅ Passwords match!'); document.getElementById('su-pw2').classList.remove('err'); }
  else{ setFmsg('su-pw2-msg','err','❌ Passwords do not match'); document.getElementById('su-pw2').classList.add('err'); }
}
function setFmsg(id,type,txt) {
  const el=document.getElementById(id);
  el.className=`fmsg${type?' show '+type:''}`;
  el.textContent=txt;
}
function xIcon(c){ return `<svg width="14" height="14" fill="none" stroke="${c}" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`; }
function checkIcon(){ return `<svg width="14" height="14" fill="none" stroke="var(--accent)" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`; }
function warnIcon(){ return `<svg width="14" height="14" fill="none" stroke="var(--yellow)" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`; }

// ═══════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════
function doLogin() {
  const id = document.getElementById('ci-id').value.trim().toLowerCase();
  const pw = document.getElementById('ci-pw').value;
  if (!id || !pw) { showToast('⚠️ Please fill in all fields'); return; }
  const u = USERS.find(u => u.email === id);
  if (!u) { showToast('❌ No account found. Please sign up.'); return; }
  if (u.pw && pw !== u.pw && pw.length < 3) { showToast('❌ Incorrect password'); return; }
  loginAsCivilian(u);
}
function doSignup() {
  const name  = document.getElementById('su-name').value.trim();
  const mobile= document.getElementById('su-mobile').value.trim();
  const email = document.getElementById('su-email').value.trim().toLowerCase();
  const pw    = document.getElementById('su-pw').value;
  const pw2   = document.getElementById('su-pw2').value;
  if (!name || !email || !mobile || !pw || !pw2) { showToast('⚠️ Please fill in all required fields'); return; }
  if (pw !== pw2) { showToast('❌ Passwords do not match'); return; }
  let s=0; if(pw.length>=8)s++; if(/[A-Z]/.test(pw))s++; if(/[0-9]/.test(pw))s++; if(/[^A-Za-z0-9]/.test(pw))s++;
  if (s < 2) { showToast('⚠️ Please choose a stronger password (min 8 chars, 1 uppercase, 1 number)'); return; }
  if (USERS.find(u=>u.email===email)) { showToast('❌ Email already registered'); return; }
  const newUser = { email, name, mobile, pw, role:'civilian', address:'', googleUser:false };
  USERS.push(newUser);
  showToast('🎉 Account created! Welcome aboard!');
  setTimeout(()=>{ switchCivTab('signin'); document.getElementById('ci-id').value=email; }, 1500);
}
function doAuthLogin() {
  const id = document.getElementById('auth-id').value.trim();
  const pw = document.getElementById('auth-pw').value;
  if (!id || !pw) { showToast('⚠️ Please enter your ID and password'); return; }
  const u = AUTH_USERS.find(u => u.id === id && u.pw === pw);
  if (!u) { showToast('❌ Invalid credentials'); return; }
  if (currentRole === 'admin' && u.role !== 'admin') { showToast('❌ This ID is not an Admin account'); return; }
  if (currentRole === 'authority' && u.role !== 'authority') { showToast('❌ This ID is not an Authority account'); return; }

  if (u.role === 'admin') {
    showToast(`✅ Welcome, ${u.name}!`);
    setTimeout(() => {
      switchScreen('adminScreenWrapper');
      initAdmin(u);
    }, 600);
  } else {
    showToast(`✅ Welcome, ${u.name}! Authority dashboard coming soon.`);
  }
}

// ═══════ GOOGLE LOGIN — 2-STEP CREDENTIAL FLOW ═══════
function openGooglePicker() {
  document.getElementById('g-email').value = '';
  document.getElementById('g-email-msg').className = 'fmsg';
  document.getElementById('g-step-email') && null;
  document.getElementById('google-step-email').style.display = 'block';
  document.getElementById('google-step-password').style.display = 'none';
  document.getElementById('googlePickerModal').classList.add('open');
}
function closeGooglePicker() {
  document.getElementById('googlePickerModal').classList.remove('open');
}
function validateGoogleEmail(inp) {
  const v = inp.value.trim();
  if (!v) { setFmsg('g-email-msg','',''); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    setFmsg('g-email-msg','err','⚠️ Enter a valid email address');
  } else {
    setFmsg('g-email-msg','ok','✅ Looks good!');
  }
}
function googleNextStep() {
  const email = document.getElementById('g-email').value.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFmsg('g-email-msg','err','⚠️ Please enter a valid Google email address'); return;
  }
  document.getElementById('google-step-email').style.display = 'none';
  document.getElementById('google-step-password').style.display = 'block';

  // Show user's own email in the preview card
  document.getElementById('g-email-preview').textContent = email;
  document.getElementById('g-name-preview').textContent  = 'Enter your name below ↓';
  document.getElementById('g-avatar-preview').textContent = '?';

  document.getElementById('g-name').value = '';
  document.getElementById('g-pw').value   = '';
  setFmsg('g-name-msg','','');
  setFmsg('g-pw-msg','','');

  // Live-update avatar + name preview as user types their name
  const nameInput = document.getElementById('g-name');
  nameInput.oninput = function() {
    const v = this.value.trim();
    if (v) {
      const initials = v.split(' ').filter(Boolean).map(n=>n[0]).join('').toUpperCase().slice(0,2);
      document.getElementById('g-avatar-preview').textContent = initials || '?';
      document.getElementById('g-name-preview').textContent   = v;
    } else {
      document.getElementById('g-avatar-preview').textContent = '?';
      document.getElementById('g-name-preview').textContent   = 'Enter your name below ↓';
    }
  };
  setTimeout(() => nameInput.focus(), 80);
}
function googleBackStep() {
  document.getElementById('google-step-email').style.display = 'block';
  document.getElementById('google-step-password').style.display = 'none';
}
function googleSignIn() {
  const email = document.getElementById('g-email').value.trim().toLowerCase();
  const name  = document.getElementById('g-name').value.trim();
  const pw    = document.getElementById('g-pw').value;
  let valid = true;
  if (!name) { setFmsg('g-name-msg','err','⚠️ Please enter your full name'); valid=false; }
  if (!pw || pw.length < 6) { setFmsg('g-pw-msg','err','⚠️ Password must be at least 6 characters'); valid=false; }
  if (!valid) return;

  // Update display with entered name
  const initials = name.split(' ').map(n=>n[0]).join('').toUpperCase();
  document.getElementById('g-avatar-preview').textContent = initials;
  document.getElementById('g-name-preview').textContent = name;

  closeGooglePicker();

  // Check if user already exists in session; if not, create
  let u = USERS.find(u => u.email === email);
  if (!u) {
    u = { email, name, mobile:'', pw:'', role:'civilian', address:'', googleUser:true };
    USERS.push(u);
  } else {
    u.googleUser = true;
    if (!u.name || u.name === email.split('@')[0]) u.name = name;
  }
  loginAsCivilian(u);
}

// ═══════ FORGOT PASSWORD ═══════
function openForgotModal() {
  const emailField = document.getElementById('ci-id');
  if (emailField && emailField.value) {
    document.getElementById('forgot-email').value = emailField.value;
  }
  document.getElementById('forgotModal').classList.add('open');
}
function openForgotModalProfile() {
  if (currentUser) document.getElementById('forgot-email').value = currentUser.email;
  document.getElementById('forgotModal').classList.add('open');
}
function sendResetLink() {
  const email = document.getElementById('forgot-email').value.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFmsg('forgot-msg','err','⚠️ Please enter a valid email address'); return;
  }
  const exists = USERS.find(u => u.email === email);
  if (!exists) {
    setFmsg('forgot-msg','err','❌ No account found with this email'); return;
  }
  setFmsg('forgot-msg','ok','✅ Reset link sent! Check your inbox.');
  showToast(`📬 Password reset link sent to ${email}`);
  setTimeout(()=>{ document.getElementById('forgotModal').classList.remove('open'); }, 2000);
}

// ═══════ LOGIN / LOGOUT ═══════
function loginAsCivilian(u) {
  currentUser = u;

  // Load any previously saved profile from localStorage
  const saved = loadProfileFromStorage(u.email);
  if (saved) {
    currentUser.mobile  = saved.mobile  || u.mobile  || '';
    currentUser.address = saved.address || u.address || '';
    currentUser.lang    = saved.lang    || 'en';
    const usr = USERS.find(x => x.email === u.email);
    if (usr) { usr.mobile = currentUser.mobile; usr.address = currentUser.address; }
  }

  const initials  = u.name.split(' ').map(n=>n[0]).join('').toUpperCase();
  const firstName = u.name.split(' ')[0];

  document.getElementById('sb-avatar').textContent   = initials;
  document.getElementById('sb-uname').textContent    = u.name;
  document.getElementById('welcome-name').textContent = firstName;
  document.getElementById('p-avatar').textContent    = initials;
  document.getElementById('p-name').textContent      = u.name;
  document.getElementById('p-email').value           = u.email;
  document.getElementById('p-mobile').value          = currentUser.mobile || '';
  document.getElementById('p-address').value         = currentUser.address || '';
  document.getElementById('r-name').value            = u.name;
  document.getElementById('r-contact').value         = currentUser.mobile || u.email;
  document.getElementById('google-badge').style.display = u.googleUser ? 'block' : 'none';

  // Lock mobile if already saved
  if (currentUser.mobile) {
    const mf = document.getElementById('p-mobile');
    mf.readOnly = true;
    mf.style.background = 'var(--field)';
    mf.style.opacity    = '.75';
    mf.style.cursor     = 'not-allowed';
    document.getElementById('p-mobile-status').textContent = '🔒';
    setFmsg('p-mobile-msg','ok','🔒 Mobile number saved and locked');
  }

  // Apply saved language preference
  if (currentUser.lang && currentUser.lang !== 'en') {
    setTimeout(() => setLang(currentUser.lang), 150);
  }

  renderNotifications();
  updateStats();
  renderOverviewIssues();
  renderFeedbackRequests();
  renderTrackingTabs();
  updateProfileCompletionUI();
  updateNotifBadge();

  showToast(`✅ Welcome${u.googleUser ? '' : ' back'}, ${firstName}! 👋`);
  setTimeout(() => {
    switchScreen('civilianPage');
    showPanel('overview', document.getElementById('nav-overview'));
  }, 800);
  applyTranslations();
}
function doLogout() {
  currentUser = null;
  uploadedPhotos = [];
  showToast('👋 Signed out successfully');
  setTimeout(()=> switchScreen('loginPage'), 600);
}

// ═══════════════════════════════════════════
// PROFILE SAVE — localStorage + backend payload
// ═══════════════════════════════════════════
function validateProfileMobile(inp) {
  const v = inp.value.trim();
  const status = document.getElementById('p-mobile-status');
  const msg = document.getElementById('p-mobile-msg');
  if (!v) { msg.className='fmsg'; status.textContent=''; return; }
  if (!/^[+]?[\d\s\-]{10,15}$/.test(v)) {
    msg.className='fmsg show err'; msg.textContent='⚠️ Enter a valid mobile number (10–15 digits)';
    status.textContent='❌'; inp.classList.add('err'); inp.classList.remove('ok');
  } else {
    msg.className='fmsg show ok'; msg.textContent='✅ Valid mobile number';
    status.textContent='✅'; inp.classList.remove('err'); inp.classList.add('ok');
  }
}

function saveProfile() {
  if (!currentUser) return;
  const mobile  = document.getElementById('p-mobile').value.trim();
  const address = document.getElementById('p-address').value.trim();
  const lang    = document.getElementById('p-lang').value;

  // Validate mandatory fields
  if (!mobile) {
    document.getElementById('p-mobile').classList.add('err');
    setFmsg('p-mobile-msg','err','❌ Mobile number is required to save your profile');
    document.getElementById('p-mobile').focus();
    showToast('❌ Mobile number is mandatory'); return;
  }
  if (!/^[+]?[\d\s\-]{10,15}$/.test(mobile)) {
    setFmsg('p-mobile-msg','err','⚠️ Enter a valid mobile number');
    showToast('⚠️ Please enter a valid mobile number'); return;
  }

  // Update in-memory user object
  currentUser.mobile  = mobile;
  currentUser.address = address;
  currentUser.lang    = lang;
  const u = USERS.find(u => u.email === currentUser.email);
  if (u) { u.mobile=mobile; u.address=address; u.lang=lang; }

  // Lock mobile field after first save
  const mobileField = document.getElementById('p-mobile');
  mobileField.readOnly = true;
  mobileField.style.background = 'var(--field)';
  mobileField.style.opacity = '.75';
  mobileField.style.cursor = 'not-allowed';
  document.getElementById('p-mobile-status').textContent = '🔒';
  setFmsg('p-mobile-msg','ok','🔒 Mobile number saved and locked');

  // Update report form contact
  document.getElementById('r-contact').value = mobile;

  // ── SAVE TO localStorage ──────────────────
  const profilePayload = {
    email:    currentUser.email,
    name:     currentUser.name,
    mobile,
    address,
    lang,
    googleUser: currentUser.googleUser || false,
    savedAt:  new Date().toISOString(),
  };
  try {
    localStorage.setItem(`civicpulse_profile_${currentUser.email}`, JSON.stringify(profilePayload));
    console.log('✅ [CivicPulse] Profile saved to localStorage:', profilePayload);
    console.log('📡 [CivicPulse] Backend API call would look like:\nPOST /api/profile\nAuthorization: Bearer <token>\nContent-Type: application/json\n\n', JSON.stringify(profilePayload, null, 2));
  } catch(e) {
    console.warn('localStorage not available:', e);
  }

  // Update completion UI
  updateProfileCompletionUI();
  showToast(t('profile_saved'));
}

function updateProfileCompletionUI() {
  const hasMobile = currentUser?.mobile;
  const banner    = document.getElementById('profile-incomplete-banner');
  const indicator = document.getElementById('profile-complete-indicator');
  if (banner)    banner.style.display    = hasMobile ? 'none'  : 'block';
  if (indicator) indicator.style.display = hasMobile ? 'block' : 'none';
}

function loadProfileFromStorage(email) {
  try {
    const saved = localStorage.getItem(`civicpulse_profile_${email}`);
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return null;
}

// ═══════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════
function switchScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
const PANEL_TITLE_KEYS = {
  overview:'nav_overview', report:'nav_report',
  tracking:'nav_tracking', notifications:'nav_notifications', profile:'nav_profile'
};
function showPanel(id, navEl) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-'+id).classList.add('active');
  const pt = document.getElementById('panel-title');
  pt.textContent = t(PANEL_TITLE_KEYS[id] || id);
  pt.dataset.panelKey = PANEL_TITLE_KEYS[id] || '';
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navEl) navEl.classList.add('active');
  if (id === 'tracking') renderTrackingTabs();
  if (id === 'overview') { updateStats(); renderOverviewIssues(); renderFeedbackRequests(); }
  if (id === 'notifications') renderNotifications();
}

// ═══════════════════════════════════════════
// STATS — dynamic from user's complaints
// ═══════════════════════════════════════════
function getUserComplaints() {
  if (!currentUser) return [];
  return Object.values(COMPLAINTS).filter(c => c.reportedBy === currentUser.email);
}
function updateStats() {
  const cs = getUserComplaints();
  document.getElementById('stat-total').textContent = cs.length;
  document.getElementById('stat-progress').textContent = cs.filter(c=>c.status==='In Progress').length;
  document.getElementById('stat-resolved').textContent = cs.filter(c=>c.status==='Resolved').length;
  document.getElementById('stat-pending').textContent = cs.filter(c=>c.status==='Open').length;
  document.getElementById('update-count').textContent = NOTIFICATIONS.filter(n=>!n.read && n.forUser===currentUser?.email).length;
}

// ═══════════════════════════════════════════
// OVERVIEW ISSUE LIST
// ═══════════════════════════════════════════
function renderOverviewIssues() {
  const list = document.getElementById('overview-issue-list');
  const cs = getUserComplaints();
  if (!cs.length) {
    list.innerHTML = `<div style="color:var(--ink2);font-size:13px;padding:20px 0;text-align:center">${t('no_issues_yet')}</div>`;
    return;
  }
  const badgeMap = {
    'In Progress':`<span class="badge badge-progress">${t('in_progress_badge')}</span>`,
    'Open':`<span class="badge badge-open">${t('open_badge')}</span>`,
    'Resolved':`<span class="badge badge-resolved">${t('resolved_badge')}</span>`,
  };
  const priorityPip = { Critical:'ph', High:'ph', Medium:'pm', Low:'pl' };
  list.innerHTML = cs.slice(-5).reverse().map(c => `
    <div class="issue-card" onclick="openIssueModal('${c.id}')">
      <span class="issue-emoji">${c.emoji}</span>
      <div class="issue-body">
        <div class="issue-title">${c.title}</div>
        <div class="issue-meta">
          <span>📍 ${c.loc}</span>
          <span>📅 ${c.date}</span>
          <span>🆔 ${c.id}</span>
        </div>
      </div>
      <div class="issue-right">
        ${badgeMap[c.status]||''}
        <span class="priority-pip ${priorityPip[c.priority]||'pl'}"></span>
      </div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════
// FEEDBACK REQUESTS — overview bottom
// ═══════════════════════════════════════════
function renderFeedbackRequests() {
  const box = document.getElementById('feedback-requests');
  const pending = getUserComplaints().filter(c => c.status==='Resolved' && !c.feedback);
  if (!pending.length) { box.innerHTML=''; return; }
  box.innerHTML = pending.map(c => `
    <div class="confirm-box" style="margin-top:12px">
      <div>
        <div style="font-size:13px;font-weight:600;margin-bottom:2px">${c.emoji} ${c.id} — ${c.title}</div>
        <div style="font-size:12px;color:var(--ink2)">${t('resolved_badge')} — ${t('feedback_pending')}?</div>
      </div>
      <div class="confirm-btns">
        <button class="btn-confirm btn-yes" onclick="openFeedbackModal('${c.id}')">${t('feedback_pending')}</button>
      </div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════
// FEEDBACK MODAL
// ═══════════════════════════════════════════
function openFeedbackModal(issueId) {
  const c = COMPLAINTS[issueId];
  if (!c) return;
  feedbackIssueId = issueId;
  selectedFeedback = null;
  document.getElementById('feedback-issue-title').textContent = c.title;
  document.getElementById('feedback-issue-id').textContent = `ID: ${c.id}`;
  document.getElementById('feedback-comment').value='';
  ['satisfied','partial','unsatisfied'].forEach(k=>{
    document.getElementById('fb-'+k).classList.remove('selected');
  });
  const btn = document.getElementById('feedback-submit-btn');
  btn.style.opacity='0.5'; btn.style.pointerEvents='none';
  document.getElementById('feedbackModal').classList.add('open');
}
function selectFeedback(type) {
  selectedFeedback = type;
  ['satisfied','partial','unsatisfied'].forEach(k=>{
    document.getElementById('fb-'+k).classList.toggle('selected', k===type);
  });
  const btn = document.getElementById('feedback-submit-btn');
  btn.style.opacity='1'; btn.style.pointerEvents='auto';
}
function submitFeedback() {
  if (!selectedFeedback||!feedbackIssueId) return;
  const comment = document.getElementById('feedback-comment').value.trim();
  COMPLAINTS[feedbackIssueId].feedback = { rating:selectedFeedback, comment, date:new Date().toLocaleString() };
  document.getElementById('feedbackModal').classList.remove('open');
  // Push notification to admin (simulated)
  const c = COMPLAINTS[feedbackIssueId];
  NOTIFICATIONS.unshift({
    id:'nfb-'+feedbackIssueId, icon:'⭐',
    title:`⭐ Feedback Received — ${feedbackIssueId}`,
    text:`User rated: <strong>${selectedFeedback}</strong>${comment?' — "'+comment+'"':''}`,
    time:'Just now', read:false, forUser:currentUser?.email
  });
  showToast('⭐ Thank you for your feedback!');
  renderFeedbackRequests();
  updateStats();
  renderNotifications();
  updateNotifBadge();
  feedbackIssueId = null;
}

// ═══════════════════════════════════════════
// TRACKING
// ═══════════════════════════════════════════
function renderTrackingTabs() {
  const tabs = document.getElementById('tracking-tabs');
  const cs = getUserComplaints();
  if (!cs.length) {
    tabs.innerHTML='';
    document.getElementById('tracking-detail').innerHTML=`<div style="color:var(--ink2);font-size:13px;padding:20px 0">${t('no_reports_yet')}</div>`;
    return;
  }
  tabs.innerHTML = cs.map((c,i) => `
    <button class="${i===0?'btn-primary':'btn-outline'}" id="tab-${c.id}"
      style="font-size:12px;padding:7px 14px" onclick="showTrack('${c.id}',this)">
      ${c.emoji} ${c.id}
    </button>
  `).join('');
  if (cs.length) showTrack(cs[cs.length-1].id, tabs.firstElementChild);
}

function showTrack(id, tabEl) {
  // Update active tab styles
  document.querySelectorAll('#tracking-tabs button').forEach(b=>{
    b.className = 'btn-outline'; b.style.fontSize='12px'; b.style.padding='7px 14px';
  });
  if (tabEl) { tabEl.className='btn-primary'; tabEl.style.fontSize='12px'; tabEl.style.padding='7px 14px'; }

  const issue = COMPLAINTS[id];
  if (!issue) return;

  const badgeMap = {
    'In Progress':`<span class="badge badge-progress">${t('in_progress_badge')}</span>`,
    'Open':`<span class="badge badge-open">${t('open_badge')}</span>`,
    'Resolved':`<span class="badge badge-resolved">${t('resolved_badge')}</span>`,
  };
  const steps = ['📝','👀','🔍','🔧','✅'];
  const stepLabels = ['Submitted','Assigned','Inspected','Work Started','Resolved'];
  const doneCount = issue.timeline.filter(t=>t.done).length;
  const stepsHTML = steps.map((s,i)=>`
    <div class="prog-step">
      <div class="prog-dot ${i<doneCount?'done':i===doneCount?'current':''}">${i<doneCount?'✓':''}</div>
      <div class="prog-label ${i<doneCount?'done':''}">${s} ${stepLabels[i]}</div>
    </div>
  `).join('');
  const tlHTML = issue.timeline.map(item=>`
    <div class="tl-item">
      <div class="tl-dot ${item.done?'done':item.current?'current':''}"></div>
      <div class="tl-title">${item.title}</div>
      <div class="tl-desc">${item.desc}</div>
      <div class="tl-time">🕐 ${item.time}</div>
      ${item.remark?`<div class="tl-remark">💬 "${item.remark}"</div>`:''}
    </div>
  `).join('');

  const feedbackHTML = issue.feedback ? `
    <div class="tl-remark" style="margin-top:12px">
      ⭐ <strong>Your Feedback:</strong> ${issue.feedback.rating}${issue.feedback.comment?' — "'+issue.feedback.comment+'"':''}
    </div>` : '';

  document.getElementById('tracking-detail').innerHTML = `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${issue.emoji} ${issue.id} — ${issue.title}</div>
          <div style="font-size:12px;color:var(--ink2);margin-top:3px">📅 ${issue.date} · 🗂️ ${issue.cat}</div>
        </div>
        ${badgeMap[issue.status]||''}
      </div>
      <div class="card-body">
        <div class="progress-wrap">
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:8px">
            <span style="font-weight:600;font-size:12px">${t('resolution_progress')}</span>
            <span style="color:var(--accent);font-weight:700">${issue.progress}%</span>
          </div>
          <div style="background:var(--border);border-radius:99px;height:6px;overflow:hidden;margin-bottom:16px">
            <div style="width:${issue.progress}%;height:100%;background:var(--accent);border-radius:99px;transition:width .8s ease"></div>
          </div>
          <div class="progress-track">${stepsHTML}</div>
        </div>
        <div style="margin-top:20px">
          <div style="font-family:'Instrument Serif',serif;font-size:15px;margin-bottom:14px">${t('timeline_lbl')}</div>
          <div class="timeline">${tlHTML}</div>
          ${feedbackHTML}
        </div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="card">
        <div class="card-head"><div class="card-title">${t('details_lbl')}</div></div>
        <div class="card-body">
          <table class="detail-table">
            <tr><td>${t('issue_id_lbl')}</td><td>${issue.id}</td></tr>
            <tr><td>${t('category_col')}</td><td>${issue.cat}</td></tr>
            <tr><td>${t('priority_col')}</td><td>${issue.priority}</td></tr>
            <tr><td>${t('location_col')}</td><td>${issue.loc}</td></tr>
            <tr><td>${t('assigned_col')}</td><td>${issue.dept}</td></tr>
            <tr><td>${t('status_col')}</td><td>${issue.status}</td></tr>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">${t('actions_lbl')}</div></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:8px">
          <button class="btn-outline" style="width:100%;text-align:left;padding:10px 14px" onclick="sendAdminNotification('${issue.id}','${issue.dept}')">
            ${t('send_reminder')}
          </button>
          <button class="btn-outline" style="width:100%;text-align:left;padding:10px 14px" onclick="copyToClipboard('Issue ${issue.id}: ${issue.title}')">
            ${t('share_report')}
          </button>
          <button class="btn-outline" style="width:100%;text-align:left;padding:10px 14px;color:var(--red);border-color:var(--red)" onclick="escalateIssue('${issue.id}')">
            ${t('escalate')}
          </button>
        </div>
      </div>
    </div>
  `;
}

function sendAdminNotification(issueId, dept) {
  NOTIFICATIONS.unshift({
    id:'nr-'+Date.now(), icon:'📬',
    title:`📬 Reminder Sent — ${issueId}`,
    text:`User sent a reminder to <strong>${dept}</strong> regarding <strong>${issueId}</strong>.`,
    time:'Just now', read:false, forUser:currentUser?.email
  });
  showToast(`📬 Reminder sent to ${dept}!`);
  renderNotifications(); updateNotifBadge();
}
function escalateIssue(issueId) {
  NOTIFICATIONS.unshift({
    id:'ne-'+Date.now(), icon:'🚨',
    title:`🚨 Escalated — ${issueId}`,
    text:`Issue <strong>${issueId}</strong> has been escalated. Admin has been notified.`,
    time:'Just now', read:false, forUser:currentUser?.email
  });
  showToast('🚨 Issue escalated! Admin has been notified.');
  renderNotifications(); updateNotifBadge();
}
function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).catch(()=>{});
  showToast('🔗 Report link copied to clipboard!');
}

// ═══════════════════════════════════════════
// ISSUE MODAL
// ═══════════════════════════════════════════
function openIssueModal(id) {
  const issue = COMPLAINTS[id];
  if (!issue) return;
  document.getElementById('modal-title').textContent = `${issue.emoji} ${issue.title}`;
  document.getElementById('modal-sub').textContent = `${issue.id} · ${issue.date}`;
  const badgeMap = {
    'In Progress':`<span class="badge badge-progress">${t('in_progress_badge')}</span>`,
    'Open':`<span class="badge badge-open">${t('open_badge')}</span>`,
    'Resolved':`<span class="badge badge-resolved">${t('resolved_badge')}</span>`,
  };
  document.getElementById('modal-body').innerHTML = `
    <div style="margin-bottom:14px">${badgeMap[issue.status]||''}</div>
    <p style="font-size:13px;color:var(--ink2);line-height:1.7;margin-bottom:18px">${issue.desc}</p>
    <div style="background:var(--field);border-radius:var(--r-sm);padding:14px;margin-bottom:18px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
        <div>📍 <strong>${issue.loc}</strong></div>
        <div>🚦 <strong>${issue.priority}</strong></div>
        <div>🗂️ <strong>${issue.cat}</strong></div>
        <div>🔧 <strong>${issue.dept}</strong></div>
        <div>🆔 <strong>${issue.id}</strong></div>
      </div>
    </div>
    ${issue.photos.length?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">${issue.photos.map(p=>`<img src="${p}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1.5px solid var(--border)"/>`).join('')}</div>`:''}
    <div style="display:flex;gap:10px">
      <button class="submit-btn" style="flex:1;padding:11px;font-size:13px" onclick="showPanel('tracking',document.getElementById('nav-tracking'));closeModal()">
        ${t('track_btn')}
      </button>
      <button class="btn-outline" onclick="closeModal()">${t('close_btn')}</button>
    </div>
  `;
  document.getElementById('issueModal').classList.add('open');
}
function closeModal() { document.getElementById('issueModal').classList.remove('open'); }

// ═══════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════
function renderNotifications() {
  const list = document.getElementById('notif-dynamic-list');
  if (!list) return;
  const userNotifs = NOTIFICATIONS.filter(n => n.forUser === currentUser?.email || !n.forUser);
  if (!userNotifs.length) { list.innerHTML='<div style="color:var(--ink2);font-size:13px;padding:20px 0">No notifications yet.</div>'; return; }
  list.innerHTML = userNotifs.map(n => `
    <div class="notif-item ${n.read?'':'unread'}" id="${n.id}" onclick="markRead('${n.id}')">
      <div class="notif-icon-wrap">${n.icon}</div>
      <div class="notif-body">
        <div class="notif-title">${n.title}</div>
        <div class="notif-text">${n.text}</div>
        <div class="notif-time">${n.time}</div>
      </div>
      ${n.read?'':'<div class="unread-dot"></div>'}
    </div>
  `).join('');
}
function markRead(id) {
  const notif = NOTIFICATIONS.find(n => n.id === id);
  if (notif) notif.read = true;
  const el = document.getElementById(id);
  if (el) { el.classList.remove('unread'); const dot=el.querySelector('.unread-dot'); if(dot) dot.remove(); }
  updateNotifBadge();
  if (currentUser) updateStats();
}
function markAllRead() {
  NOTIFICATIONS.forEach(n => { if (n.forUser===currentUser?.email) n.read=true; });
  renderNotifications(); updateNotifBadge();
  showToast(t('mark_all_read'));
}
function updateNotifBadge() {
  const count = NOTIFICATIONS.filter(n=>!n.read && n.forUser===currentUser?.email).length;
  const badge = document.getElementById('notif-count');
  if (badge) { badge.textContent=count; badge.style.display=count>0?'':'none'; }
  const dot = document.getElementById('notif-dot');
  if (dot) dot.style.display = count>0?'block':'none';
}

// ═══════════════════════════════════════════
// REPORT SUBMIT — generates unique CP-XXXX id
// ═══════════════════════════════════════════
function submitReport() {
  const title   = document.getElementById('r-title').value.trim();
  const cat     = document.getElementById('r-cat').value;
  const priority= document.getElementById('r-priority').value;
  const desc    = document.getElementById('r-desc').value.trim();
  const loc     = document.getElementById('r-loc').value.trim();
  if (!title||!cat||!desc||!loc) { showToast('⚠️ Please fill in all required fields'); return; }

  const newId = 'CP-' + idCounter++;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  const timeStr = now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});

  const DEPT_MAP = {
    'Roads & Potholes':'Roads Dept.','Street Lighting':'Electricity Dept.',
    'Waste & Sanitation':'Sanitation Dept.','Water & Drainage':'Water Dept.',
    'Parks & Recreation':'Parks Dept.','Electricity':'Electricity Dept.',
    'Public Transport':'Transport Dept.','Noise & Pollution':'Environment Dept.',
    'Buildings & Property':'Municipal Corp.',
  };
  const EMOJI_MAP = {
    'Roads & Potholes':'🚧','Street Lighting':'💡','Waste & Sanitation':'🗑️',
    'Water & Drainage':'💧','Parks & Recreation':'🌳','Electricity':'⚡',
    'Public Transport':'🚌','Noise & Pollution':'🔊','Buildings & Property':'🏚️',
  };

  const complaint = {
    id: newId,
    emoji: EMOJI_MAP[cat] || '📋',
    title, cat, priority,
    loc, desc,
    date: dateStr,
    dept: DEPT_MAP[cat] || 'Municipal Corp.',
    status: 'Open',
    reportedBy: currentUser.email,
    photos: [...uploadedPhotos],
    feedback: null,
    timeline: [
      { title:'📝 Issue Submitted', desc:`Report received and logged. Complaint ID: ${newId}`, time:`${dateStr} · ${timeStr}`, done:true },
      { title:'👀 Under Review', desc:'Admin will review and assign shortly.', time:'Pending', done:false, current:true },
      { title:'🔍 Site Inspection', desc:'Pending assignment.', time:'Pending', done:false },
      { title:'🔧 Work Started', desc:'Pending.', time:'Pending', done:false },
      { title:'✅ Resolved', desc:'Pending.', time:'Pending', done:false },
    ],
    progress: 10,
  };

  COMPLAINTS[newId] = complaint;

  // Admin-facing notification
  NOTIFICATIONS.unshift({
    id:'nsubmit-'+newId, icon:'📝',
    title:`📝 New Report Submitted — ${newId}`,
    text:`<strong>${currentUser.name}</strong> submitted a new complaint: <strong>${title}</strong> (${cat}).`,
    time:'Just now', read:false, forUser:currentUser.email
  });

  // Clear form
  ['r-title','r-desc','r-loc'].forEach(id => document.getElementById(id).value='');
  document.getElementById('r-cat').selectedIndex=0;
  document.getElementById('r-priority').selectedIndex=2;
  document.getElementById('photo-previews').innerHTML='';
  uploadedPhotos=[];

  showToast(`${t('report_submitted')} ID: ${newId}`);
  updateStats(); renderNotifications(); updateNotifBadge();
  setTimeout(()=> showPanel('tracking', document.getElementById('nav-tracking')), 1200);
}

// ═══════════════════════════════════════════
// PHOTO UPLOAD
// ═══════════════════════════════════════════
function handlePhotoUpload(input) {
  const previews = document.getElementById('photo-previews');
  Array.from(input.files).forEach(file => {
    if (file.size > 10*1024*1024) { showToast('⚠️ File too large — max 10MB'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      uploadedPhotos.push(e.target.result);
      const img = document.createElement('div');
      img.style.cssText='position:relative;display:inline-block';
      img.innerHTML=`
        <img src="${e.target.result}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1.5px solid var(--border)"/>
        <button onclick="removePhoto(this,'${e.target.result}')" style="position:absolute;top:-6px;right:-6px;background:var(--red);color:#fff;border:none;border-radius:50%;width:18px;height:18px;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center">✕</button>
      `;
      previews.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}
function removePhoto(btn, src) {
  uploadedPhotos = uploadedPhotos.filter(p => p !== src);
  btn.closest('div').remove();
}

// ═══════════════════════════════════════════
// LOCATION DETECT
// ═══════════════════════════════════════════
function detectLocation() {
  const txt = document.getElementById('loc-field-txt');
  if (!navigator.geolocation) { showToast('⚠️ Geolocation not supported'); return; }
  txt.textContent = '📡 Detecting location…';
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude: lat, longitude: lng } = pos.coords;
    const locStr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    document.getElementById('r-loc').value = locStr;
    txt.textContent = `✅ Location detected: ${locStr}`;
    showToast('📍 Location pinned successfully!');
  }, () => {
    txt.textContent = t('click_detect');
    showToast('⚠️ Could not detect location. Please type manually.');
  });
}

// ═══════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════
function toggleEye(id, btn) {
  const f = document.getElementById(id);
  f.type = f.type==='password' ? 'text' : 'password';
  btn.style.opacity = f.type==='text' ? '0.4' : '1';
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=> t.classList.remove('show'), 3500);
}

// ═══════════════════════════════════════════
// CLICK OUTSIDE HANDLERS
// ═══════════════════════════════════════════
document.addEventListener('click', e => {
  if (e.target.id === 'issueModal') closeModal();
  if (e.target.id === 'googlePickerModal') closeGooglePicker();
  if (e.target.id === 'forgotModal') document.getElementById('forgotModal').classList.remove('open');
  if (e.target.id === 'feedbackModal') document.getElementById('feedbackModal').classList.remove('open');
  if (!e.target.closest('#dashLangBtn') && !e.target.closest('#dashLangDrop')) {
    const drop = document.getElementById('dashLangDrop');
    if (drop) drop.classList.remove('open');
  }
});

// ═══════════════════════════════════════════
// VOICE INPUT + TRANSLATION
// ═══════════════════════════════════════════
(function initVoiceInput() {
  const voiceBtn           = document.getElementById('voiceBtn');
  const voiceBtnLabel      = document.getElementById('voiceBtnLabel');
  const voiceStatus        = document.getElementById('voiceStatus');
  const voiceTimer         = document.getElementById('voiceTimer');
  const voiceLang          = document.getElementById('voiceLang');
  const descTextarea       = document.getElementById('r-desc');
  const translateBtn       = document.getElementById('translateBtn');
  const translationPanel   = document.getElementById('translationPanel');
  const translationOutput  = document.getElementById('translationOutput');
  const useTranslationBtn  = document.getElementById('useTranslationBtn');
  const closeTranslationBtn= document.getElementById('closeTranslationBtn');

  if (!voiceBtn || !descTextarea) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    voiceBtn.disabled     = true;
    translateBtn.disabled = true;
    voiceBtn.title        = 'Voice input not supported in this browser';
    setVStatus('Voice input not supported in this browser.', 'error');
    return;
  }

  let recognition   = null;
  let isRecording   = false;
  let timerInterval = null;
  let seconds       = 0;
  let interimBuffer = '';

  function setVStatus(msg, type) {
    voiceStatus.textContent = msg;
    voiceStatus.className   = 'voice-status' + (type ? ' ' + type : '');
  }

  function startVTimer() {
    seconds = 0; voiceTimer.textContent = '0:00';
    timerInterval = setInterval(() => {
      seconds++;
      const m = Math.floor(seconds / 60), s = String(seconds % 60).padStart(2,'0');
      voiceTimer.textContent = `${m}:${s}`;
    }, 1000);
  }

  function stopVTimer() { clearInterval(timerInterval); voiceTimer.textContent = ''; }

  function setRecordingUI(active) {
    isRecording = active;
    voiceBtn.classList.toggle('recording', active);
    voiceBtnLabel.textContent = active ? 'Stop' : 'Voice Input';
    voiceBtn.title = active ? 'Stop recording' : 'Record voice description';
    if (voiceLang) voiceLang.disabled = active;
  }

  function buildRecognition() {
    const r = new SpeechRecognition();
    r.lang           = voiceLang ? voiceLang.value : 'en-IN';
    r.interimResults = true;
    r.continuous     = true;
    r.maxAlternatives = 1;
    const baseText   = descTextarea.value.trim();

    r.onstart = () => {
      setRecordingUI(true); startVTimer();
      setVStatus('🎙️ Listening…'); interimBuffer = '';
    };
    r.onresult = (event) => {
      let interim = '', finalBit = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const tx = event.results[i][0].transcript;
        event.results[i].isFinal ? (finalBit += tx + ' ') : (interim += tx);
      }
      if (finalBit) interimBuffer += finalBit;
      const committed = baseText ? baseText + ' ' + interimBuffer : interimBuffer;
      descTextarea.value = (committed + interim).trim();
      descTextarea.dispatchEvent(new Event('input'));
    };
    r.onerror = (event) => {
      const msgs = {
        'not-allowed' : '🚫 Microphone access denied.',
        'no-speech'   : '🤐 No speech detected.',
        'network'     : '🌐 Network error.',
        'audio-capture':'🎤 No microphone found.',
        'aborted'     : '',
      };
      const msg = msgs[event.error] ?? `Error: ${event.error}`;
      if (msg) setVStatus(msg, 'error');
      stopRecordingV(false);
    };
    r.onend = () => { if (isRecording) stopRecordingV(true); };
    return r;
  }

  function stopRecordingV(showSuccess) {
    setRecordingUI(false); stopVTimer();
    if (recognition) { try { recognition.stop(); } catch(_) {} recognition = null; }
    if (showSuccess) {
      const nonEn = voiceLang && !voiceLang.value.startsWith('en');
      setVStatus(nonEn ? '✅ Done! Click "Translate to English" to convert.' : '✅ Transcription complete!', 'success');
      setTimeout(() => setVStatus(''), 4000);
    }
  }

  voiceBtn.addEventListener('click', async () => {
    if (isRecording) { stopRecordingV(true); return; }
    try { await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { setVStatus('🚫 Microphone access denied. Check browser permissions.', 'error'); return; }
    recognition = buildRecognition();
    try { recognition.start(); }
    catch { setVStatus('Could not start voice recognition.', 'error'); }
  });

  // Translation via MyMemory (free, no API key, 500 words/day)
  async function translateText(text, sourceLang) {
    const code = sourceLang.split('-')[0];
    const url  = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${code}|en`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error('Translation service unavailable.');
    const data = await res.json();
    if (data.responseStatus !== 200) throw new Error(data.responseDetails || 'Translation failed.');
    return data.responseData.translatedText;
  }

  translateBtn.addEventListener('click', async () => {
    const text = descTextarea.value.trim();
    if (!text) {
      setVStatus('Nothing to translate — write or record a description first.', 'error');
      setTimeout(() => setVStatus(''), 3000); return;
    }
    const lang = voiceLang ? voiceLang.value : 'en-IN';
    if (lang.startsWith('en')) {
      setVStatus('Text is already in English!', 'success');
      setTimeout(() => setVStatus(''), 3000); return;
    }
    translateBtn.disabled = true;
    translateBtn.classList.add('translating');
    translateBtn.querySelector('span').textContent = 'Translating…';
    translationPanel.style.display = 'none';
    setVStatus('🔄 Translating…');
    try {
      const translated = await translateText(text, lang);
      translationOutput.textContent = translated;
      translationPanel.style.display = 'block';
      setVStatus('✅ Translation ready!', 'success');
      setTimeout(() => setVStatus(''), 3000);
    } catch (err) {
      setVStatus('❌ ' + err.message, 'error');
    } finally {
      translateBtn.disabled = false;
      translateBtn.classList.remove('translating');
      translateBtn.querySelector('span').textContent = 'Translate to English';
    }
  });

  useTranslationBtn.addEventListener('click', () => {
    descTextarea.value = translationOutput.textContent;
    descTextarea.dispatchEvent(new Event('input'));
    translationPanel.style.display = 'none';
    setVStatus('✅ Translation applied!', 'success');
    setTimeout(() => setVStatus(''), 3000);
  });

  closeTranslationBtn.addEventListener('click', () => {
    translationPanel.style.display = 'none';
  });
})();

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
applyTranslations();
