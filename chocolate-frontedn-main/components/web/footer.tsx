export default function Footer() {
  return (
    <footer className="bg-[#3b1f0e] text-amber-100 py-10 mt-auto">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-amber-300 mb-3">ChocoERP</h3>
            <p className="text-sm text-amber-200/70 leading-relaxed">
              Crafting premium chocolates with love and tradition since 2010.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-amber-300 mb-3">Contact</h3>
            <ul className="space-y-1 text-sm text-amber-200/70">
              <li>123 Cocoa Lane, UK</li>
              <li>+94 11 234 5678</li>
              <li>hello@chocoeRP.lk</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-amber-300 mb-3">Hours</h3>
            <ul className="space-y-1 text-sm text-amber-200/70">
              <li>Mon – Fri: 9:00 AM – 6:00 PM</li>
              <li>Sat: 10:00 AM – 4:00 PM</li>
              <li>Sun: Closed</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-amber-800 pt-4 text-center text-xs text-amber-200/50">
          &copy; {new Date().getFullYear()} ChocoERP. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
