import { resolveAssetSrc } from "@/lib/utils/paths";
import styles from "./page.module.scss";

const clips = [
  {
    src: "/videos/karate/rotterdam-2018-semifinal.mp4",
    poster: "/videos/karate/rotterdam-2018-semifinal.jpg",
    caption: "Semifinal highlights, 6th Rotterdam Open (Kyokushinkai Tezuka Cup), 2018",
  },
  {
    src: "/videos/karate/scotland-3rd-place-v3.mp4",
    poster: "/videos/karate/scotland-3rd-place-v3.jpg",
    caption: "Fight for 3rd place, Scottish Open 2018, highlights (I’m aka, red)",
  },
  {
    src: "/videos/karate/shiro-fight-v2.mp4",
    poster: "/videos/karate/shiro-fight-v2.jpg",
    caption: "Tournament fight highlights, ending on my knockdown (I’m shiro, white)",
  },
  {
    src: "/videos/karate/scs-2016.mp4",
    poster: "/videos/karate/scs-2016.jpg",
    caption: "Fight at the 22nd Sabaki Challenge Spirit, the Ashihara Karate world cup, 2016",
  },
  {
    src: "/videos/karate/japan.mp4",
    poster: "/videos/karate/japan.jpg",
    caption: "All Japan Shin Kyokushin tournament, Ehime regional qualifier, 2015 (I’m in red)",
  },
];

export function KarateClips() {
  return (
    <div id="karate" className={styles.karate}>
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
