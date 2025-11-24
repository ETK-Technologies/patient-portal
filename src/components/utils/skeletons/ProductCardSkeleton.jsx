// Loading skeleton component for ProductCard (with price variant for merchandise)
const ProductCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-[#E3E3E3] rounded-[16px] shadow-[0px_0px_16px_0px_#00000014] w-[140px] h-[140px] flex-shrink-0">
      <div className="w-full h-full rounded-[16px] bg-gray-200"></div>
    </div>
    <div className="text-start pt-2">
      {/* Product name skeleton */}
      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
      {/* Price skeleton */}
      <div className="h-4 bg-gray-200 rounded w-16"></div>
    </div>
  </div>
);

export default ProductCardSkeleton;

