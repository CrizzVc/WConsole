import React from 'react';
import YoutubeIframe from 'react-native-youtube-iframe';

interface YoutubePlayerProps {
  videoId: string;
  height: number;
  width?: number | string;
  play?: boolean;
  mute?: boolean;
}

const YoutubePlayer: React.FC<YoutubePlayerProps> = ({ 
  videoId, 
  height, 
  width = '100%', 
  play = false, 
  mute = false 
}) => {
  return (
    <YoutubeIframe
      height={height}
      width={width as number}
      play={play}
      videoId={videoId}
      mute={mute}
      initialPlayerParams={{
        loop: true,
        controls: false,
        modestbranding: true,
        rel: false,
      }}
    />
  );
};

export default YoutubePlayer;
