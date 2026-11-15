import { Reveal, stagger } from "@/components/Reveal";
import { resolveAssetSrc } from "@/lib/utils/paths";
import styles from "./page.module.scss";

const clips = [
  {
    src: "/videos/karate/rotterdam-2018-semifinal.mp4",
    poster: "/videos/karate/rotterdam-2018-semifinal.jpg",
    caption: "Semifinal highlights, 6th Rotterdam Open (Kyokushinkai Tezuka Cup), 2018",
  },
  {
    src: "/videos/karate/scotland-3rd-place-v4.mp4",
    poster: "/videos/karate/scotland-3rd-place-v4.jpg",
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
    <Reveal id="karate" className={styles.karate}>
      <div className={`${styles.subhead} reveal-item`}>
        <h3>On the mat</h3>
        <p>Bareknuckle full-contact karate: a few moments from tournaments I&apos;ve fought in.</p>
      </div>
      <div className={styles.karateGrid}>
        {clips.map((clip, index) => (
          <figure key={clip.src} className={`${styles.karateClip} reveal-item`} style={stagger(index + 1)}>
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
    </Reveal>
  );
}
