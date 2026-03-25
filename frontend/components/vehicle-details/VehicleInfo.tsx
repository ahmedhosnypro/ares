import React from "react";

interface Spec {
  label: string;
  value: string;
  icon?: string; // You can pass icon names or SVG paths
}

interface VehicleInfoProps {
  readonly vehicle?: any;
}

export default function VehicleInfo({ vehicle }: VehicleInfoProps) {
  // 1. استخراج الداتا الأساسية مع قيم افتراضية عشان الصفحة متضربش لو الداتا لسه بتحمل
  const name = vehicle?.name || "Unknown Vehicle";
  const description = vehicle?.description || "No description available.";
  
  // 2. ربطنا مصفوفة المواصفات بالـ Interface عشان TypeScript يبقى مرتاح
  const specs: Spec[] = vehicle?.specs || [];
  
  // (ممكن تستخدم الـ features دي بعدين لو حبيت تعرضها تحت المواصفات)
  const features: string[] = vehicle?.features || [];

  return (
    <div className="flex flex-col gap-10">
      
      {/* Title and Live Badge Area */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {name}
        </h1>
        
        {/* Live Availability Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 ring-1 ring-inset ring-emerald-500/20">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Available Now
          </span>
        </div>
      </div>

      {/* Description Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900">About this vehicle</h3>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Specifications Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Key Specifications</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {specs.map((spec, index) => (
            <div 
              key={index} 
              className="group flex flex-col justify-center rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lg hover:shadow-slate-200/40 hover:border-slate-200"
            >
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                {spec.label}
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-900 transition-colors group-hover:text-blue-600">
                {spec.value}
              </span>
            </div>
          ))}
          
          {/* لو المصفوفة فاضية، نعرض رسالة شيك بدل ما المكان يفضل فاضي */}
          {specs.length === 0 && (
            <div className="col-span-2 sm:col-span-3 text-sm text-slate-500 italic">
              No specifications added yet.
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}