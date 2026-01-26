
import React from 'react';
import { BookOpenIcon, BeakerIcon, BoltIcon, MoonIcon, BrainIcon, NoSymbolIcon, UserGroupIcon, SparklesIcon, StethoscopeIcon } from './icons';

const AccordionItem: React.FC<{ title: string; children: React.ReactNode; icon?: React.ReactNode; gradient?: string }> = ({ title, children, icon, gradient }) => {
  return (
    <details className="group rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-md open:shadow-lg open:ring-1 open:ring-teal-100 dark:open:ring-teal-900">
      <summary className="flex cursor-pointer list-none items-center justify-between font-bold p-4 bg-gray-50 dark:bg-gray-700/50 group-open:bg-white dark:group-open:bg-gray-800 transition-colors">
        <span className="text-sm md:text-base text-gray-800 dark:text-white flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block"></span>
            {title}
        </span>
        <span className="transition-transform group-open:rotate-180 bg-gray-200 dark:bg-gray-600 rounded-full p-1">
          <svg fill="none" height="16" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="16" className="text-gray-600 dark:text-gray-300"><path d="M6 9l6 6 6-6"></path></svg>
        </span>
      </summary>
      <div className="p-5 text-gray-600 dark:text-gray-300 prose prose-sm max-w-none leading-relaxed border-t border-gray-100 dark:border-gray-700">
        {icon && gradient && (
            <div className={`mb-5 rounded-xl overflow-hidden shadow-inner w-full h-28 flex items-center justify-center bg-gradient-to-r ${gradient} relative`}>
                <div className="absolute inset-0 bg-white opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                <div className="text-5xl text-white drop-shadow-md transform transition-transform duration-700 group-hover:scale-110">
                    {icon}
                </div>
            </div>
        )}
        {children}
      </div>
    </details>
  );
};

const NutritionLiteracy: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full transform transition-all duration-300 pb-24">
      <div className="text-center mb-8">
        <div className="bg-teal-50 dark:bg-teal-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
            <BookOpenIcon className="w-10 h-10 text-teal-600 dark:text-teal-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">เวชศาสตร์วิถีชีวิต (Lifestyle Medicine)</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">
          ศาสตร์แห่งการดูแลสุขภาพแบบองค์รวม 11 เสาหลัก เพื่อสุขภาพดีวิถีไทย
        </p>
      </div>
      
      <div className="space-y-4">
        <AccordionItem 
            title="บทนำ: เวชศาสตร์วิถีชีวิต คืออะไร?"
            icon={<i className="fa-solid fa-seedling"></i>}
            gradient="from-teal-400 to-emerald-600"
        >
          <p>
            <strong>Lifestyle Medicine</strong> คือการใช้รูปแบบการดำเนินชีวิตเป็นยาหลักในการป้องกัน จัดการ และรักษาโรคเรื้อรัง (NCDs) เช่น โรคเบาหวาน ความดันโลหิตสูง โรคหัวใจ และโรคอ้วน
            โดยเน้นการแก้ที่ต้นเหตุมากกว่าการรักษาที่ปลายเหตุ ด้วยการปรับเปลี่ยนพฤติกรรมในด้านต่างๆ
          </p>
        </AccordionItem>

        <AccordionItem 
            title="เสาหลักที่ 1: โภชนาการสมดุล (Balanced Nutrition)"
            icon={<BeakerIcon className="w-12 h-12" />}
            gradient="from-orange-400 to-red-500"
        >
          <p>เน้นการรับประทานอาหารแบบ <strong>Plant-Based Whole Foods</strong> หรืออาหารจากพืชที่ไม่ผ่านการขัดสี:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>เน้นพืชเป็นหลัก:</strong> ผัก ผลไม้ ธัญพืชไม่ขัดสี ถั่ว และเมล็ดพืช</li>
            <li><strong>ลดอาหารแปรรูป:</strong> หลีกเลี่ยงอาหารที่มีน้ำตาลสูง โซเดียมสูง และไขมันทรานส์</li>
            <li><strong>จำกัดเนื้อแดง:</strong> และเนื้อสัตว์แปรรูป เพื่อลดความเสี่ยงมะเร็งและโรคหัวใจ</li>
            <li><strong>จานสุขภาพ (Healthy Plate):</strong> แบ่งจานเป็น 4 ส่วน: ผัก 2 ส่วน, แป้งไม่ขัดสี 1 ส่วน, โปรตีน 1 ส่วน</li>
          </ul>
        </AccordionItem>

        <AccordionItem 
            title="เสาหลักที่ 2: กิจกรรมทางกาย (Physical Activity)"
            icon={<BoltIcon className="w-12 h-12" />}
            gradient="from-yellow-400 to-orange-500"
        >
          <p>การมีกิจกรรมทางกายสม่ำเสมอช่วยลดความเสี่ยงโรค NCDs ได้อย่างมหาศาล:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>แอโรบิก:</strong> เดินเร็ว วิ่ง ปั่นจักรยาน อย่างน้อย 150 นาที/สัปดาห์ (ระดับปานกลาง)</li>
            <li><strong>เวทเทรนนิ่ง:</strong> เสริมสร้างกล้ามเนื้อ อย่างน้อย 2 วัน/สัปดาห์</li>
            <li><strong>ขยับระหว่างวัน:</strong> ลุกเดินทุกๆ 1 ชั่วโมง ลดพฤติกรรมเนือยนิ่ง (Sedentary Lifestyle)</li>
          </ul>
        </AccordionItem>
        
        <AccordionItem 
            title="เสาหลักที่ 3: การนอนหลับ (Sleep)"
            icon={<MoonIcon className="w-12 h-12" />}
            gradient="from-indigo-500 to-purple-600"
        >
          <p>การนอนที่ดีคือรากฐานของสุขภาพภูมิคุ้มกันและสมดุลฮอร์โมน:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>นอนให้ได้ <strong>7-9 ชั่วโมง</strong> ต่อคืน</li>
            <li>เข้านอนและตื่นนอนให้เป็นเวลาเดียวกันทุกวัน</li>
            <li>หลีกเลี่ยงแสงสีฟ้าจากหน้าจอก่อนนอนอย่างน้อย 1 ชั่วโมง</li>
            <li>งดคาเฟอีนหลังเที่ยงวัน</li>
          </ul>
        </AccordionItem>

        <AccordionItem 
            title="เสาหลักที่ 4: การจัดการความเครียด (Stress Management)"
            icon={<BrainIcon className="w-12 h-12" />}
            gradient="from-rose-400 to-pink-600"
        >
          <p>ความเครียดเรื้อรังส่งผลร้ายต่อระบบภูมิคุ้มกันและหัวใจ:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>ฝึกการหายใจลึกๆ (Deep Breathing) หรือทำสมาธิ</li>
            <li>หางานอดิเรกที่ชอบทำเพื่อผ่อนคลาย</li>
            <li>รู้จักปฏิเสธงานที่เกินกำลัง และจัดสรรเวลาพักผ่อน</li>
          </ul>
        </AccordionItem>

        <AccordionItem 
            title="เสาหลักที่ 5: การลดพฤติกรรมเสี่ยง (Risk Reduction)"
            icon={<NoSymbolIcon className="w-12 h-12" />}
            gradient="from-red-500 to-red-700"
        >
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>งดสูบบุหรี่:</strong> การเลิกบุหรี่เป็นสิ่งที่ดีที่สุดที่คุณทำได้เพื่อปอดและหัวใจ</li>
            <li><strong>จำกัดแอลกอฮอล์:</strong> หากดื่ม ควรดื่มในปริมาณที่จำกัด (ไม่เกิน 1 แก้วสำหรับหญิง, 2 แก้วสำหรับชาย ต่อวัน)</li>
            <li><strong>เลี่ยงสารเสพติด:</strong> และพฤติกรรมที่เสี่ยงต่ออุบัติเหตุ</li>
          </ul>
        </AccordionItem>

        <AccordionItem 
            title="เสาหลักที่ 6: การสร้างความสัมพันธ์ที่ดี (Relationships)"
            icon={<UserGroupIcon className="w-12 h-12" />}
            gradient="from-teal-400 to-emerald-600"
        >
          <p>ความโดดเดี่ยวส่งผลเสียต่อสุขภาพเทียบเท่าการสูบบุหรี่:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>รักษาความสัมพันธ์ที่ดีกับครอบครัวและเพื่อนฝูง</li>
            <li>เข้าร่วมกิจกรรมกลุ่มหรือชมรมที่มีความสนใจเดียวกัน</li>
            <li>หาที่ปรึกษาหรือระบายความรู้สึกเมื่อมีปัญหา</li>
          </ul>
        </AccordionItem>

        <AccordionItem 
            title="เสาหลักที่ 7: สุขภาพช่องปาก (Oral Health)"
            icon={<i className="fa-solid fa-tooth"></i>}
            gradient="from-cyan-400 to-blue-500"
        >
          <p>สุขภาพช่องปากที่ดีส่งผลโดยตรงต่อสุขภาพร่างกายโดยรวม โดยเฉพาะโรคหัวใจและเบาหวาน:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>หลัก 2-2-2:</strong> แปรงฟันวันละ 2 ครั้ง นานครั้งละ 2 นาที และงดทานอาหารหลังแปรง 2 ชั่วโมง</li>
            <li><strong>ใช้ไหมขัดฟัน:</strong> ทำความสะอาดซอกฟันทุกวันเพื่อลดการสะสมของแบคทีเรีย</li>
            <li><strong>พบทันตแพทย์:</strong> ตรวจสุขภาพฟันและขูดหินปูนทุก 6 เดือน</li>
          </ul>
        </AccordionItem>

        <AccordionItem 
            title="เสาหลักที่ 8: สุขภาพทางเพศ (Sexual Health)"
            icon={<i className="fa-solid fa-venus-mars"></i>}
            gradient="from-pink-500 to-rose-500"
        >
          <p>สุขภาวะทางเพศที่ปลอดภัยและมีความรับผิดชอบ:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>ป้องกันเสมอ:</strong> สวมถุงยางอนามัยเพื่อป้องกันโรคติดต่อทางเพศสัมพันธ์</li>
            <li><strong>ตรวจคัดกรอง:</strong> ตรวจสุขภาพประจำปี รวมทั้งมะเร็งปากมดลูกและมะเร็งต่อมลูกหมากตามวัย</li>
            <li><strong>สื่อสาร:</strong> สร้างความเข้าใจและให้เกียรติซึ่งกันและกันในชีวิตคู่</li>
          </ul>
        </AccordionItem>

        <AccordionItem 
            title="เสาหลักที่ 9: อนามัยสิ่งแวดล้อม (Environmental Health)"
            icon={<i className="fa-solid fa-tree"></i>}
            gradient="from-emerald-500 to-green-700"
        >
          <p>สภาพแวดล้อมที่ดีช่วยส่งเสริมสุขภาพกายและใจ:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>อากาศบริสุทธิ์:</strong> หลีกเลี่ยงพื้นที่ที่มีฝุ่น PM2.5 และควันพิษ</li>
            <li><strong>ความสะอาด:</strong> จัดบ้านให้โปร่ง โล่ง สะอาด ลดแหล่งสะสมเชื้อโรค</li>
            <li><strong>พื้นที่สีเขียว:</strong> ปลูกต้นไม้หรือหาเวลาสัมผัสธรรมชาติเพื่อผ่อนคลาย</li>
          </ul>
        </AccordionItem>

        <AccordionItem 
            title="เสาหลักที่ 10: เวชศาสตร์ชะลอวัย (Anti-Aging)"
            icon={<SparklesIcon className="w-12 h-12" />}
            gradient="from-amber-300 to-yellow-500"
        >
          <p>ดูแลตัวเองให้แข็งแรงและดูอ่อนกว่าวัยจากภายในสู่ภายนอก:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>ปกป้องผิว:</strong> ทาครีมกันแดดทุกวันเพื่อป้องกันริ้วรอยและมะเร็งผิวหนัง</li>
            <li><strong>ต้านอนุมูลอิสระ:</strong> ทานผักผลไม้หลากสีที่มีสารต้านอนุมูลอิสระสูง</li>
            <li><strong>บริหารสมอง:</strong> เรียนรู้สิ่งใหม่ๆ เสมอเพื่อป้องกันภาวะสมองเสื่อม</li>
          </ul>
        </AccordionItem>

        <AccordionItem 
            title="เสาหลักที่ 11: สุขภาพการขับถ่าย (Excretory Health)"
            icon={<i className="fa-solid fa-toilet"></i>}
            gradient="from-blue-400 to-indigo-500"
        >
          <p>ระบบขับถ่ายที่ดีคือสัญญาณของสุขภาพลำไส้และภูมิคุ้มกันที่แข็งแรง:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>ไฟเบอร์สูง:</strong> ทานผักผลไม้และธัญพืชเพื่อเพิ่มกากใยช่วยในการขับถ่าย</li>
            <li><strong>ดื่มน้ำเพียงพอ:</strong> น้ำช่วยให้อุจจาระนิ่มและขับถ่ายได้ง่ายขึ้น</li>
            <li><strong>ฝึกนิสัย:</strong> ขับถ่ายให้เป็นเวลาทุกวัน ไม่กลั้นอุจจาระ</li>
          </ul>
        </AccordionItem>
        
        <AccordionItem 
            title="เพิ่มเติม: แนวทางเฉพาะโรค NCDs"
            icon={<StethoscopeIcon className="w-12 h-12" />}
            gradient="from-slate-600 to-slate-800"
        >
          <div className="space-y-4">
            <div>
                <h4 className="font-bold text-teal-600 dark:text-teal-400">สำหรับโรคเบาหวาน (Diabetes)</h4>
                <ul className="list-disc pl-5 text-sm">
                    <li>ควบคุมปริมาณคาร์โบไฮเดรต เลือกทานคาร์บเชิงซ้อน (ข้าวกล้อง, ธัญพืช)</li>
                    <li>หลีกเลี่ยงน้ำตาล เครื่องดื่มหวาน และผลไม้รสหวานจัด</li>
                    <li>ทานอาหารที่มีใยอาหารสูง เพื่อชะลอการดูดซึมน้ำตาล</li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold text-red-500 dark:text-red-400">สำหรับโรคความดันโลหิตสูง (Hypertension)</h4>
                <ul className="list-disc pl-5 text-sm">
                    <li>ใช้หลักการ <strong>DASH Diet</strong> (Dietary Approaches to Stop Hypertension)</li>
                    <li>ลดโซเดียม (เกลือ) ไม่เกิน 1 ช้อนชา หรือ 2,000 มก. ต่อวัน</li>
                    <li>เลี่ยงอาหารหมักดอง อาหารกระป๋อง และบะหมี่กึ่งสำเร็จรูป</li>
                    <li>เพิ่มโพแทสเซียมจากผักและผลไม้ (เช่น กล้วย, ผักโขม)</li>
                </ul>
            </div>
            
            <div>
                <h4 className="font-bold text-pink-500 dark:text-pink-400">สำหรับโรคมะเร็ง (Cancer Prevention)</h4>
                <ul className="list-disc pl-5 text-sm">
                    <li>เน้นผักผลไม้หลากสีเพื่อรับสารต้านอนุมูลอิสระ (Antioxidants)</li>
                    <li>จำกัดเนื้อแดง (ไม่เกิน 500g/สัปดาห์) และงดเนื้อสัตว์แปรรูป (ไส้กรอก, เบคอน)</li>
                    <li>งดเครื่องดื่มแอลกอฮอล์และงดสูบบุหรี่โดยเด็ดขาด</li>
                    <li>รักษาน้ำหนักตัวให้สมส่วน การมีไขมันส่วนเกินเพิ่มความเสี่ยงมะเร็ง</li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-orange-500 dark:text-orange-400">สำหรับโรคอ้วน (Obesity)</h4>
                <ul className="list-disc pl-5 text-sm">
                    <li>สร้าง <strong>Calorie Deficit</strong> (กินให้น้อยกว่าที่ใช้) อย่างถูกวิธี</li>
                    <li>ลดของทอด ของมัน และขนมหวานที่มีน้ำตาลสูง</li>
                    <li>เน้นโปรตีนและผักเพื่อให้อิ่มนานขึ้น</li>
                    <li>ขยับร่างกายให้มากขึ้นในชีวิตประจำวัน (NEAT) นอกเหนือจากการออกกำลังกาย</li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-blue-500 dark:text-blue-400">สำหรับโรคหัวใจและหลอดเลือด (Cardiovascular Disease)</h4>
                <ul className="list-disc pl-5 text-sm">
                    <li>ลดไขมันอิ่มตัว (จากกะทิ, หนังสัตว์) และไขมันทรานส์ (เบเกอรี่, ครีมเทียม)</li>
                    <li>เลือกไขมันดี (HDL) เช่น น้ำมันมะกอก, อะโวคาโด, ปลาทะเล</li>
                    <li>เพิ่มใยอาหารเพื่อช่วยลดระดับคอเลสเตอรอลในเลือด</li>
                    <li>ควบคุมความเครียด เพราะส่งผลต่ออัตราการเต้นของหัวใจและความดัน</li>
                </ul>
            </div>
          </div>
        </AccordionItem>

      </div>
    </div>
  );
};

export default NutritionLiteracy;
