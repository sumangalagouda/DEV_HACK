/**
 * Brand Logo Component
 * 
 * To change the logo:
 * Option 1: Replace the SVG code below with your custom SVG
 * Option 2: Use an image file - replace the entire component with:
 *   return <img src="/logo.png" alt="Logo" className="w-10 h-10" />;
 */

const BrandLogo = ({ size = 40, className = "" }: { size?: number; className?: string }) => {
  return (
    <img 
      src="/logo.png" 
      alt="Consafe Logo" 
      width={size} 
      height={size} 
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
};

export default BrandLogo;

