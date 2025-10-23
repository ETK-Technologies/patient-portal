import CustomImage from "../utils/CustomImage";

export default function ForYouCard({
  brandName,
  offer,
  imageUrl,
  backgroundColor = "bg-gray-100",
  className = "",
  imageShape = "circle", // "circle", "square"
  imageSize = "medium", // "small", "medium", "large"
  customImageClasses = "",
  textBackgroundGradient = "", // Custom gradient for text div
  imageOverlayGradient = "", // Special gradient overlay for image container
}) {
  // Image size configurations
  const imageSizes = {
    small: "w-[60px] h-[60px] md:w-[92px] md:h-[92px]",
    medium: "w-[114.16px] h-[60px] md:w-[136px] md:h-[72px]",
    large: "w-[140.56px] h-[80px] md:w-[188px] md:h-[124px]",
  };

  // Image shape configurations
  const imageShapes = {
    circle: "rounded-full",
    square: "",
  };

  const imageContainerClasses = `${imageSizes[imageSize]} ${imageShapes[imageShape]} overflow-hidden  flex items-center justify-center relative`;

  return (
    <div
      className={`flex flex-col items-center justify-between rounded-[16px] w-[140.56px] h-[166.5px] md:w-[188px] md:h-[214px] shadow-[0px_0px_11.96px_0px_#00000014] flex-shrink-0 overflow-hidden  `}
    >
      <div
        className={`relative ${backgroundColor} ${className} w-full h-full flex items-center justify-center`}
      >
        {/* Flexible Image Container */}
        <div className={`${imageContainerClasses} `}>
          <CustomImage
            src={imageUrl}
            alt={brandName}
            fill
            className={`object-cover ${customImageClasses}`}
          />
          {/* Special gradient overlay */}
          {imageOverlayGradient && (
            <div
              className={`absolute bottom-0 left-0 right-0 h-1/2 ${imageOverlayGradient}`}
            ></div>
          )}
        </div>
      </div>

      <div className={`p-3 md:p-4 w-full ${textBackgroundGradient}`}>
        {/* Brand Name */}
        <h3 className="text-[12px] md:text-[14px] font-[400] leading-[140%] mb-[1.5px] md:mb-[2px] text-black break-words">
          {brandName}
        </h3>

        {/* Offer */}
        <p className="text-[14px] md:text-[16px] font-[500] leading-[130%] text-black break-words max-w-[150px]">
          {offer}
        </p>
      </div>
    </div>
  );
}
