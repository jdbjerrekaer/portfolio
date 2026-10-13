import { resolveAssetSrc } from "@/lib/utils/paths";
import styles from "./page.module.scss";

const clips = [
  {
    src: "/videos/karate/rotterdam-2018-semifinal.mp4",
    poster: "/videos/karate/rotterdam-2018-semifinal.jpg",
    caption: "Semifinal highlights, 6th Rotterdam Open (Kyokushinkai Tezuka Cup), 2018",
  },
  {
    src: "/videos/karate/scs-2016.mp4",
    poster: "/videos/karate/scs-2016.jpg",
    caption: "Fight at the 22nd Sabaki Challenge Spirit, the Ashihara Karate world cup, 2016",
  },
];

export function KarateClips() {
  return (
    <div className={styles.karate}>
      <h3 className={styles.karateTitle}>On the mat</h3>
      <p className={styles.karateIntro}>
        Bareknuckle full-contact karate: a few moments from tournaments I&apos;ve fought in.
      </p>
      <div className={styles.karateGrid}>
        {clips.map((clip) => (
          <figure key={clip.src} className={styles.karateClip}>
            <video
              className={styles.karateVideo}
              src={resolveAssetSrc(clip.src)}
              poster={resolveAssetSrc(clip.poster)}
              controls
              playsInline
              preload="none"
            />
            <figcaption className={styles.karateCaption}>{clip.caption}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
