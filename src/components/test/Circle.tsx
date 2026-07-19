interface CircleProps {
  x: number;
  y: number;
  radius: number;
  imageUrl: string;
  onClickHandler: () => void;
}

export const Circle = ({ x, y, radius, imageUrl, onClickHandler }: CircleProps) => {
  return (
    <>
      <style>
        {`
          @keyframes blink {
            0%, 100% {
              opacity: 1; /* Fully visible */
            }
            50% {
              opacity: 0.3; /* Partially transparent */
            }
          }
        `}
      </style>
      <img
        src={imageUrl}
        onClick={onClickHandler}
        alt="Clickable calibration target"
        style={{
          position: 'absolute',
          left: x - radius, // Center the image horizontally at x coordinate
          top: y - radius, // Center the image vertically at y coordinate
          width: radius * 2,
          height: radius * 2,
          objectFit: 'contain',
          cursor: 'pointer',
          animation: 'blink 0.5s infinite',
        }}
      />
    </>
  );
};
