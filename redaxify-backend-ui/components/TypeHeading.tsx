import React, { useEffect, useState } from "react";

const TypingHeading: React.FC = () => {
  const [text, setText] = useState("");
  const fullText = "edaxify";
  const [index, setIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isDeleting) {
        setText(fullText.substring(0, index + 1));
        setIndex(index + 1);

        if (index === fullText.length) {
          // Wait a bit before starting to delete
          setTypingSpeed(500);
          setIsDeleting(true);
        }
      } else {
        setText(fullText.substring(0, index - 1));
        setIndex(index - 1);

        if (index === 0) {
          setIsDeleting(false);
          setTypingSpeed(150);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [index, isDeleting, typingSpeed]);

  return (
    <h2 className="text-white text-5xl font-semibold">
      R{text}
      <span className="animate-blink">_</span>
    </h2>
  );
};

export default TypingHeading;
