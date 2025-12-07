// Minimal i18n wrapper for code quality compliance
// Lightweight i18n with in-memory translations and localStorage persistence
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'app_language';

const translations = {
  en: {
    // Home/Hero
    'home.bookConsultation': 'Book Consultation',
    'hero.badge': 'Ancient Wisdom, Modern Care',
    'hero.title.suffix': 'Wellness Portal',
    'hero.subtitle.prefix': "Experience Panchakarma's transformative five-step detox ritual—",
    'hero.subtitle.highlight': 'Vamana, Virechana, Basti, Nasya, and Raktamokshana',
    'hero.subtitle.suffix': '—designed to cleanse your body, calm your mind, and restore perfect balance through our modern, seamless platform.',
    'hero.feature1': 'Holistic Healing',
    'hero.feature2': 'Natural Remedies',
    'hero.feature3': 'Expert Vaidyas',
    'hero.cta.explore': 'Explore Treatments',
    'hero.scroll': 'Scroll to explore',

    // Process Section
    'process.title': 'Your Journey to Wellness',
    'process.subtitle': 'Simple, guided steps that take you from discovery to long‑term balance.',
    'process.step1.title': 'Know Your Diseases',
    'process.step1.desc': 'Understand your health conditions through comprehensive Ayurvedic assessment and diagnosis.',
    'process.step2.title': 'Find Nearby Centers',
    'process.step2.desc': 'Locate certified Ayurved health centers and practitioners in your area.',
    'process.step3.title': 'Consult & Plan',
    'process.step3.desc': 'Vaidya diagnoses and creates a personalized digital Panchakarma plan.',
    'process.step4.title': 'Track & Heal',
    'process.step4.desc': 'Log your daily progress, track milestones, and communicate with your therapist easily.',
    'process.step5.title': 'Recover & Thrive',
    'process.step5.desc': 'Receive post-therapy guidance and see your holistic improvement over time.',

    // Tridosha
    'tridosha.title': 'Ayurvedic Tridosha',
    'tridosha.subtitle': 'The five elements combine to form the three doshas. Explore their qualities below.',
    'tridosha.vata': 'VATA',
    'tridosha.pitta': 'PITTA',
    'tridosha.kapha': 'KAPHA',
    'tridosha.description': 'Understanding your unique constitution helps tailor treatments for balance and vitality.',

    // Centers
    'centers.title': 'Popular Panchakarma Centers',
    'centers.subtitle': 'Discover trusted centers offering authentic, therapist‑led treatments.',
    'centers.bookNow': 'Book Now',

    // Testimonials
    'testimonials.title': 'What Our Community Says',
    'testimonials.subtitle': 'Stories from patients and practitioners who use our Ayurvedic platform every day.',
    'testimonials.item1.quote': 'The reminder alerts for my diet before Vamana were a lifesaver! I felt so much more prepared and the process was smooth.',
    'testimonials.item1.author': 'Priya S.',
    'testimonials.item1.role': 'Patient',
    'testimonials.item2.quote': "This software understands Ayurveda. It doesn't replace my judgment but empowers me to serve my patients better.",
    'testimonials.item2.author': 'Dr. Ajit Kumar, BAMS',
    'testimonials.item2.role': 'Ayurvedic Physician',

    // Footer
    'footer.connect': 'Connect With Us',
    'footer.quicklinks': 'Quick Links',
    'footer.link.about': 'About Us',
    'footer.link.services': 'Services',
    'footer.link.contact': 'Contact',
    'footer.subscribe': 'Subscribe',
    'footer.subscribe.subtitle': 'Get wellness tips delivered to your inbox',
    'footer.subscribe.placeholder': 'Enter your email',
    'footer.subscribe.submit': 'Submit',
    'footer.copyright': '© 2024 Ayurveda Management. All rights reserved.'
  },
  hi: {
    'home.bookConsultation': 'परामर्श बुक करें',
    'hero.badge': 'प्राचीन ज्ञान, आधुनिक देखभाल',
    'hero.title.suffix': 'वेलनेस पोर्टल',
    'hero.subtitle.prefix': 'पंचकर्म के परिवर्तनकारी पाँच-चरणीय डिटॉक्स अनुष्ठान का अनुभव करें—',
    'hero.subtitle.highlight': 'वमन, विरेचन, बस्ती, नस्य और रक्तमोक्षण',
    'hero.subtitle.suffix': '—जो आपके शरीर को शुद्ध, मन को शांत और संतुलन बहाल करने के लिए बनाया गया है।',
    'hero.feature1': 'समग्र उपचार',
    'hero.feature2': 'प्राकृतिक उपचार',
    'hero.feature3': 'विशेषज्ञ वैद्य',
    'hero.cta.explore': 'उपचार देखें',
    'hero.scroll': 'आगे जानने के लिए स्क्रॉल करें',
    'process.title': 'आपकी वेलनेस यात्रा',
    'process.subtitle': 'सरल, मार्गदर्शित चरण जो आपको दीर्घकालिक संतुलन तक ले जाते हैं।',
    'process.step1.title': 'अपनी बीमारियाँ जानें',
    'process.step1.desc': 'समग्र आयुर्वेदिक मूल्यांकन और निदान से अपने स्वास्थ्य को समझें।',
    'process.step2.title': 'नज़दीकी केंद्र खोजें',
    'process.step2.desc': 'अपने क्षेत्र में प्रमाणित आयुर्वेद केंद्र और विशेषज्ञ खोजें।',
    'process.step3.title': 'परामर्श और योजना',
    'process.step3.desc': 'वैद्य व्यक्तिगत डिजिटल पंचकर्म योजना बनाते हैं।',
    'process.step4.title': 'ट्रैक करें और स्वस्थ हों',
    'process.step4.desc': 'दैनिक प्रगति दर्ज करें, मील के पत्थर ट्रैक करें और थैरेपिस्ट से संवाद करें।',
    'process.step5.title': 'रिकवर करें और आगे बढ़ें',
    'process.step5.desc': 'उपचार के बाद मार्गदर्शन प्राप्त करें और समग्र सुधार देखें।',
    'tridosha.title': 'आयुर्वेदिक त्रिदोष',
    'tridosha.subtitle': 'पाँच तत्व मिलकर तीन दोष बनाते हैं। नीचे उनके गुण जानें।',
    'tridosha.vata': 'वात',
    'tridosha.pitta': 'पित्त',
    'tridosha.kapha': 'कफ',
    'tridosha.description': 'अपनी प्रकृति को समझना संतुलन और ऊर्जा के लिए उपचारों को अनुकूल बनाता है।',
    'centers.title': 'लोकप्रिय पंचकर्म केंद्र',
    'centers.subtitle': 'प्रामाणिक, थैरेपिस्ट-नेतृत्व वाले उपचार प्रदान करने वाले भरोसेमंद केंद्र खोजें।',
    'centers.bookNow': 'अभी बुक करें',
    'testimonials.title': 'हमारे समुदाय की राय',
    'testimonials.subtitle': 'रोगियों और वैद्यों की कहानियाँ जो हमारे प्लेटफ़ॉर्म का रोज़ उपयोग करते हैं।',
    'testimonials.item1.quote': 'वमन से पहले डाइट रिमाइंडर अलर्ट जीवनरक्षक थे! मैं अधिक तैयार था और प्रक्रिया सुचारू रही।',
    'testimonials.item1.author': 'प्रिया एस.',
    'testimonials.item1.role': 'रोगी',
    'testimonials.item2.quote': 'यह सॉफ़्टवेयर आयुर्वेद को समझता है—यह मेरे निर्णय की जगह नहीं लेता, बल्कि मुझे बेहतर सेवा देने में सक्षम बनाता है।',
    'testimonials.item2.author': 'डॉ. अजीत कुमार, BAMS',
    'testimonials.item2.role': 'आयुर्वेद वैद्य',
    'footer.connect': 'हमसे जुड़ें',
    'footer.quicklinks': 'क्विक लिंक',
    'footer.link.about': 'हमारे बारे में',
    'footer.link.services': 'सेवाएँ',
    'footer.link.contact': 'संपर्क',
    'footer.subscribe': 'सब्सक्राइब करें',
    'footer.subscribe.subtitle': 'वेलनेस टिप्स अपने इनबॉक्स में पाएं',
    'footer.subscribe.placeholder': 'अपना ईमेल दर्ज करें',
    'footer.subscribe.submit': 'सबमिट',
    'footer.copyright': '© 2024 आयुर्वेद प्रबंधन. सर्वाधिकार सुरक्षित.'
  },
  mr: {
    'home.bookConsultation': 'सल्ला बुक करा',
    'hero.badge': 'प्राचीन ज्ञान, आधुनिक काळजी',
    'hero.title.suffix': 'वेलनेस पोर्टल',
    'hero.subtitle.prefix': 'पंचकर्माच्या परिवर्तनशील पंच-टप्प्यांच्या डिटॉक्स विधीचा अनुभव घ्या—',
    'hero.subtitle.highlight': 'वमन, विरेचन, बस्ती, नस्य आणि रक्तमोक्षण',
    'hero.subtitle.suffix': '—जे शरीर शुद्ध करणे, मन शांत करणे आणि संतुलन पुनर्स्थापित करण्यासाठी तयार आहे.',
    'hero.feature1': 'समग्र उपचार',
    'hero.feature2': 'नैसर्गिक उपाय',
    'hero.feature3': 'तज्ञ वैद्य',
    'hero.cta.explore': 'उपचार पहा',
    'hero.scroll': 'अधिक जाणून घेण्यासाठी स्क्रोल करा',
    'process.title': 'तुमची वेलनेस यात्रा',
    'process.subtitle': 'सोपी, मार्गदर्शित पावले जी तुम्हाला दीर्घकालीन संतुलनाकडे नेतात.',
    'process.step1.title': 'तुमचे आजार जाणून घ्या',
    'process.step1.desc': 'समग्र आयुर्वेदिक मूल्यांकन व निदानाद्वारे तुमचे आरोग्य समजा.',
    'process.step2.title': 'जवळील केंद्र शोधा',
    'process.step2.desc': 'तुमच्या परिसरातील प्रमाणित आयुर्वेद केंद्र व तज्ञ शोधा.',
    'process.step3.title': 'सल्ला व योजना',
    'process.step3.desc': 'वैद्य वैयक्तिक डिजिटल पंचकर्म योजना तयार करतात.',
    'process.step4.title': 'ट्रॅक करा व बरे व्हा',
    'process.step4.desc': 'दैनिक प्रगती नोंदवा, टप्पे ट्रॅक करा आणि थेरपिस्टशी संवाद साधा.',
    'process.step5.title': 'रिकव्हर करा व प्रगती करा',
    'process.step5.desc': 'उपचारानंतर मार्गदर्शन मिळवा आणि समग्र सुधारणा पहा.',
    'tridosha.title': 'आयुर्वेदिक त्रिदोष',
    'tridosha.subtitle': 'पाच तत्वे मिळून तीन दोष बनतात. खाली त्यांच्या गुणधर्मांचा अभ्यास करा.',
    'tridosha.vata': 'वात',
    'tridosha.pitta': 'पित्त',
    'tridosha.kapha': 'कफ',
    'tridosha.description': 'तुमची प्रकृती समजून घेणे उपचार संतुलन व ऊर्जा देण्यासाठी उपयुक्त ठरते.',
    'centers.title': 'लोकप्रिय पंचकर्म केंद्र',
    'centers.subtitle': 'प्रमाणित, थेरपिस्ट-नेतृत्वाखालील उपचार देणारी विश्वासार्ह केंद्रे शोधा.',
    'centers.bookNow': 'आता बुक करा',
    'testimonials.title': 'आमच्या समुदायाचे मत',
    'testimonials.subtitle': 'रुग्ण आणि वैद्यांची कथा जे आमचे व्यासपीठ रोज वापरतात.',
    'testimonials.item1.quote': 'वमनपूर्वी आहार स्मरणपत्रे खूप उपयोगी पडली! मी अधिक तयार होतो आणि प्रक्रिया सुरळीत झाली.',
    'testimonials.item1.author': 'प्रिया एस.',
    'testimonials.item1.role': 'रुग्ण',
    'testimonials.item2.quote': 'हे सॉफ्टवेअर आयुर्वेद समजते—ते माझा निर्णय बदलत नाही, पण मला चांगली सेवा देण्यास सक्षम करते.',
    'testimonials.item2.author': 'डॉ. अजीत कुमार, BAMS',
    'testimonials.item2.role': 'आयुर्वेदिक वैद्य',
    'footer.connect': 'आमच्याशी जोडा',
    'footer.quicklinks': 'त्वरित दुवे',
    'footer.link.about': 'आमच्याबद्दल',
    'footer.link.services': 'सेवा',
    'footer.link.contact': 'संपर्क',
    'footer.subscribe': 'सबस्क्राइब करा',
    'footer.subscribe.subtitle': 'वेलनेस टिप्स आपल्या इनबॉक्समध्ये मिळवा',
    'footer.subscribe.placeholder': 'आपला ईमेल प्रविष्ट करा',
    'footer.subscribe.submit': 'सबमिट',
    'footer.copyright': '© 2024 आयुर्वेद व्यवस्थापन. सर्व हक्क राखीव.'
  },
  te: {
    'home.bookConsultation': 'సమావేశం బుక్ చేయండి',
    'hero.badge': 'ప్రాచీన జ్ఞానం, ఆధునిక సంరక్షణ',
    'hero.title.suffix': 'వెల్నెస్ పోర్టల్',
    'hero.subtitle.prefix': 'పంచకర్మ యొక్క మార్పును తెచ్చే ఐదు దశల డీటాక్స్ కర్మను అనుభవించండి—',
    'hero.subtitle.highlight': 'వమన, విరేచన, బస్తి, నస్య, రక్తమోక్షణ',
    'hero.subtitle.suffix': '—మీ శరీరాన్ని శుద్ధి చేసి, మనసును ప్రశాంతం చేసి, సమతౌల్యాన్ని పునరుద్ధరిస్తుంది.',
    'hero.feature1': 'సమగ్ర చికిత్స',
    'hero.feature2': 'సహజ చికిత్సలు',
    'hero.feature3': 'నిపుణ వైద్యులు',
    'hero.cta.explore': 'చికిత్సలను చూడండి',
    'hero.scroll': 'ఇంకా తెలుసుకోవడానికి స్క్రోల్ చేయండి',
    'process.title': 'మీ వెల్నెస్ ప్రయాణం',
    'process.subtitle': 'సులభమైన, మార్గదర్శక దశలు మీను దీర్ఘకాల సమతౌల్యానికి తీసుకెళ్తాయి.',
    'process.step1.title': 'మీ వ్యాధులు తెలుసుకోండి',
    'process.step1.desc': 'సమగ్ర ఆయుర్వేద మూల్యాంకనం మరియు నిర్ధారణ ద్వారా మీ ఆరోగ్యాన్ని అర్థం చేసుకోండి.',
    'process.step2.title': 'సమీప కేంద్రాలు కనుగొనండి',
    'process.step2.desc': 'మీ ప్రాంతంలో ధృవీకరించిన ఆయుర్వేద కేంద్రాలు మరియు నిపుణులను కనుగొనండి.',
    'process.step3.title': 'సలహా & ప్రణాళిక',
    'process.step3.desc': 'వైద్యుడు వ్యక్తిగత డిజిటల్ పంచకర్మ ప్రణాళిక రూపొందిస్తారు.',
    'process.step4.title': 'ట్రాక్ చేయండి & బాగుపడండి',
    'process.step4.desc': 'దైనందిన పురోగతిని నమోదు చేయండి, మైలురాళ్లను ట్రాక్ చేయండి, థెరపిస్ట్‌తో కమ్యూనికేట్ చేయండి.',
    'process.step5.title': 'పునరుద్ధరించండి & ఎదగండి',
    'process.step5.desc': 'చికిత్స అనంతర మార్గదర్శకత్వాన్ని పొందండి మరియు సమగ్ర అభివృద్ధిని చూడండి.',
    'tridosha.title': 'ఆయుర్వేద త్రిదోషాలు',
    'tridosha.subtitle': 'ఐదు మూలకాలు కలిసి మూడు దోషాలను ఏర్పాటు చేస్తాయి. వాటి లక్షణాలను తెలుసుకోండి.',
    'tridosha.vata': 'వాత',
    'tridosha.pitta': 'పిత్త',
    'tridosha.kapha': 'కఫ',
    'tridosha.description': 'మీ ప్రకృతి అర్థం చేసుకోవడం చికిత్సలను సమతౌల్యం మరియు శక్తికి అనుగుణంగా చేస్తుంది.',
    'centers.title': 'ప్రముఖ పంచకర్మ కేంద్రాలు',
    'centers.subtitle': 'నమ్మదగిన, థెరపిస్ట్-ఆధారిత చికిత్సలను అందించే కేంద్రాలను కనుగొనండి.',
    'centers.bookNow': 'ఇప్పుడే బుక్ చేయండి',
    'testimonials.title': 'మా సమాజం ఏమంటోంది',
    'testimonials.subtitle': 'ప్రతి రోజు మా వేదికను ఉపయోగించే రోగులు మరియు వైద్యుల కథలు.',
    'testimonials.item1.quote': 'వమనానికి ముందు డైట్ రిమైండర్లు చాలా ఉపయోగపడ్డాయి! నేను బాగా సిద్ధపడ్డాను మరియు ప్రక్రియ సజావుగా సాగింది.',
    'testimonials.item1.author': 'ప్రియా ఎస్.',
    'testimonials.item1.role': 'రోగి',
    'testimonials.item2.quote': 'ఈ సాఫ్ట్‌వేర్ ఆయుర్వేదాన్ని అర్థం చేసుకుంటుంది—ఇది నా తీర్పును భర్తీ చేయదు, కానీ రోగులకు మెరుగైన సేవలు అందించేందుకు సహాయపడుతుంది.',
    'testimonials.item2.author': 'డా. అజిత్ కుమార్, BAMS',
    'testimonials.item2.role': 'ఆయుర్వేద వైద్యుడు',
    'footer.connect': 'మాతో కలవండి',
    'footer.quicklinks': 'త్వరిత లింకులు',
    'footer.link.about': 'మా గురించి',
    'footer.link.services': 'సేవలు',
    'footer.link.contact': 'సంప్రదించండి',
    'footer.subscribe': 'చందా చేయండి',
    'footer.subscribe.subtitle': 'వెల్నెస్ చిట్కాలు మీ ఇన్‌బాక్స్‌కు పొందండి',
    'footer.subscribe.placeholder': 'మీ ఇమెయిల్ నమోదు చేయండి',
    'footer.subscribe.submit': 'సబ్మిట్',
    'footer.copyright': '© 2024 ఆయుర్వేద నిర్వహణ. అన్ని హక్కులుสง్రహించబడ్డాయి.'
  },
  or: {
    'home.bookConsultation': 'ପରାମର୍ଶ ବୁକ୍ କରନ୍ତୁ',
    'hero.badge': 'ପ୍ରାଚୀନ ଜ୍ଞାନ, ଆଧୁନିକ ଯତ୍ନ',
    'hero.title.suffix': 'ଏକ ସ୍ବାସ୍ଥ୍ୟ ପୋର୍ଟାଲ୍',
    'hero.subtitle.prefix': 'ପଞ୍ଚକର୍ମର ପାଞ୍ଚଟି ପଦକ୍ରମ ଡିଟକ୍ସ ଅନୁଷ୍ଠାନର ଅନୁଭବ କରନ୍ତୁ—',
    'hero.subtitle.highlight': 'ବମନ, ଵିରେଚନ, ଵସ୍ତି, ନସ୍ୟ ଏବଂ ରକ୍ତମୋକ୍ଷଣ',
    'hero.subtitle.suffix': '—ଯାହା ଆପଣଙ୍କ ଶରୀରକୁ ପରିଶୋଧନ କରେ, ମନକୁ ଶାନ୍ତ କରେ ଏବଂ ସମତା ପୁନଃସ୍ଥାପିତ କରେ।',
    'hero.feature1': 'ସମଗ୍ର ଚିକିତ୍ସା',
    'hero.feature2': 'ପ୍ରାକୃତିକ ଉପଚାର',
    'hero.feature3': 'ଦକ୍ଷ ବୈଦ୍ୟ',
    'hero.cta.explore': 'ଚିକିତ୍ସା ଦେଖନ୍ତୁ',
    'hero.scroll': 'ଅଧିକ ଜାଣିବା ପାଇଁ ସ୍କ୍ରୋଲ୍ କରନ୍ତୁ',
    'process.title': 'ଆପଣଙ୍କର ସ୍ବାସ୍ଥ୍ୟ ଯାତ୍ରା',
    'process.subtitle': 'ସରଳ, ନିର୍ଦ୍ଦେଶିତ ପଦକ୍ରମ ଯାହା ଆପଣଙ୍କୁ ଦୀର୍ଘକାଳୀନ ସମତାକୁ ନେଇଯାଏ।',
    'process.step1.title': 'ଆପଣଙ୍କ ରୋଗ ଜାଣନ୍ତୁ',
    'process.step1.desc': 'ସମଗ୍ର ଆୟୁର୍ବେଦିକ ମୂଲ୍ୟାୟନ ଏବଂ ନିଦାନ ଦ୍ୱାରା ଆପଣଙ୍କ ସ୍ବାସ୍ଥ୍ୟ ବୁଝନ୍ତୁ।',
    'process.step2.title': 'ନିକଟସ୍ଥ କେନ୍ଦ୍ର ଖୋଜନ୍ତୁ',
    'process.step2.desc': 'ଆପଣଙ୍କ ଅଞ୍ଚଳରେ ପ୍ରମାଣିତ ଆୟୁର୍ବେଦ କେନ୍ଦ୍ର ଏବଂ ବିଶେଷଜ୍ଞମାନଙ୍କୁ ଖୋଜନ୍ତୁ।',
    'process.step3.title': 'ପରାମର୍ଶ ଏବଂ ଯୋଜନା',
    'process.step3.desc': 'ବୈଦ୍ୟ ବ୍ୟକ୍ତିଗତ ଡିଜିଟାଲ୍ ପଞ୍ଚକର୍ମ ଯୋଜନା ତିଆରି କରନ୍ତି।',
    'process.step4.title': 'ଟ୍ରାକ୍ କରନ୍ତୁ ଏବଂ ସୁସ୍ଥ ହୁଅନ୍ତୁ',
    'process.step4.desc': 'ଦୈନିକ ପ୍ରଗତି ରେକର୍ଡ କରନ୍ତୁ, ମାଇଲସ୍ଟୋନ୍ ଟ୍ରାକ୍ କରନ୍ତୁ ଏବଂ ଥେରାପିଷ୍ଟ ସହିତ ଯୋଗାଯୋଗ କରନ୍ତୁ।',
    'process.step5.title': 'ପୁନରୁଦ୍ଧାର କରନ୍ତୁ ଏବଂ ଉନ୍ନତି କରନ୍ତୁ',
    'process.step5.desc': 'ଚିକିତ୍ସା ପରେ ମାର୍ଗଦର୍ଶନ ପାଆନ୍ତୁ ଏବଂ ସମଗ୍ର ଉନ୍ନତି ଦେଖନ୍ତୁ।',
    'tridosha.title': 'ଆୟୁର୍ବେଦିକ ତ୍ରିଦୋଷ',
    'tridosha.subtitle': 'ପାଞ୍ଚ ଉପାଦାନ ମିଶି ତିନିଟି ଦୋଷ ବନାଏ। ସେମାନଙ୍କର ଗୁଣ ବୁଝନ୍ତୁ।',
    'tridosha.vata': 'ବାତ',
    'tridosha.pitta': 'ପିତ୍ତ',
    'tridosha.kapha': 'କଫ',
    'tridosha.description': 'ଆପଣଙ୍କ ପ୍ରକୃତିକୁ ବୁଝିବା ଚିକିତ୍ସାକୁ ସମତୁଳନ ଏବଂ ଶକ୍ତି ପାଇଁ ଉପଯୋଗୀ କରେ।',
    'centers.title': 'ଲୋକପ୍ରିୟ ପଞ୍ଚକର୍ମ କେନ୍ଦ୍ର',
    'centers.subtitle': 'ପ୍ରାମାଣିକ, ଥେରାପିଷ୍ଟ-ନିର୍ଦ୍ଦେଶିତ ଚିକିତ୍ସା ଦେଇଥିବା ବିଶ୍ୱସନୀୟ କେନ୍ଦ୍ର ଖୋଜନ୍ତୁ।',
    'centers.bookNow': 'ଏବେ ବୁକ୍ କରନ୍ତୁ',
    'testimonials.title': 'ଆମ ସମୁଦାୟ କଣ କହୁଛି',
    'testimonials.subtitle': 'ପ୍ରତିଦିନ ଆମ ମଞ୍ଚ ବ୍ୟବହାର କରୁଥିବା ରୋଗୀ ଓ ଚିକିତ୍ସକଙ୍କ କଥା।',
    'testimonials.item1.quote': 'ଵମନ ପୂର୍ବରୁ ଡାଇଏଟ୍ ରିମାଇଣ୍ଡର୍ ବହୁତ ଉପକାରୀ ହୋଇଥିଲା! ମୁଁ ବହୁତ ପ୍ରସ୍ତୁତ ଥିଲି ଏବଂ ପ୍ରକ୍ରିୟା ସୁଗମ ଥିଲା।',
    'testimonials.item1.author': 'ପ୍ରିୟା ଏସ୍.',
    'testimonials.item1.role': 'ରୋଗୀ',
    'testimonials.item2.quote': 'ଏହି ସଫ୍ଟୱେର ଆୟୁର୍ବେଦକୁ ବୁଝେ—ଏହା ମୋର ନିଷ୍ପତ୍ତିକୁ ପରିବର୍ତ୍ତନ କରେନି, କିନ୍ତୁ ରୋଗୀଙ୍କୁ ଭଲ ସେବା ଦେବାରେ ସକ୍ଷମ କରେ।',
    'testimonials.item2.author': 'ଡା. ଅଜିତ କୁମାର, BAMS',
    'testimonials.item2.role': 'ଆୟୁର୍ବେଦିକ ଚିକିତ୍ସକ',
    'footer.connect': 'ଆମ ସହିତ ଯୋଡ଼ି ହୁଅନ୍ତୁ',
    'footer.quicklinks': 'ତ୍ରୁତିହୀନ ଲିଙ୍କ',
    'footer.link.about': 'ଆମ ବିଷୟରେ',
    'footer.link.services': 'ସେବା',
    'footer.link.contact': 'ଯୋଗାଯୋଗ',
    'footer.subscribe': 'ସବ୍ସକ୍ରାଇବ୍ କରନ୍ତୁ',
    'footer.subscribe.subtitle': 'ସ୍ୱାସ୍ଥ୍ୟ ସୁପାରିଶଗୁଡ଼ିକ ଆପଣଙ୍କ ଇନ୍‌ବକ୍ସକୁ ପଠାନ୍ତୁ',
    'footer.subscribe.placeholder': 'ଆପଣଙ୍କ ଇମେଲ୍ ଲେଖନ୍ତୁ',
    'footer.subscribe.submit': 'ଦାଖଲ',
    'footer.copyright': '© 2024 ଆୟୁର୍ବେଦ ପରିଚାଳନା। ସମସ୍ତ ଅଧିକାର ସଂରକ୍ଷିତ।'
  }
};

let currentLanguage = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'en';
  } catch (_) {
    return 'en';
  }
})();

export const getLanguage = () => currentLanguage;

export const setLanguage = (lang) => {
  currentLanguage = translations[lang] ? lang : 'en';
  try {
    localStorage.setItem(STORAGE_KEY, currentLanguage);
  } catch (_) {
    // ignore
  }
};

export const t = (key, fallback) => {
  const langMap = translations[currentLanguage] || translations.en;
  return langMap[key] || translations.en[key] || fallback || key;
};

export const availableLanguages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'or', label: 'ଓଡିଆ' }
];

// React Context to trigger re-renders when language changes
const I18nContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
  availableLanguages
});

export const I18nProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getLanguage());

  useEffect(() => {
    setLanguage(language);
  }, [language]);

  const translate = useMemo(() => {
    return (key, fallback) => {
      const langMap = translations[language] || translations.en;
      return langMap[key] || translations.en[key] || fallback || key;
    };
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage: setLanguageState,
    t: translate,
    availableLanguages
  }), [language, translate]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);



