"use client";

// Copy -> "Copied" feedback on the toolkit Button: the ORIGINAL (vendored, unchanged) next to
// a refined copy (./refined) that only changes the morph. Variants mirror the
// CopyButtonVariants story.
import { useState } from "react";
import "@fontsource/lexend/300.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "../adtraction/adtraction-global.scss";
import { Icons } from "@adtraction/ui-icons";
import { DemoButton, DemoStage } from "../DemoStage";
import { Button as OriginalButton } from "../adtraction/components/tokens/button/Button";
import { Button as RefinedButton } from "./refined/Button";

const copyIcon = <Icons.General.Copy02 strokeWidth={2.73} />;

export function CopyMorphDemo() {
  const [refined, setRefined] = useState(true);
  const Button = refined ? RefinedButton : OriginalButton;

  return (
    <DemoStage
      caption="Click any button. Toggle to compare the shipped morph with the refined one."
      controls={
        <>
          <DemoButton pressed={!refined} onClick={() => setRefined(false)}>
            Original
          </DemoButton>
          <DemoButton pressed={refined} onClick={() => setRefined(true)}>
            Refined
          </DemoButton>
        </>
      }>
      <div
        key={refined ? "refined" : "original"}
        className="adtraction-demo"
        style={{ display: "flex", gap: "16px", alignItems: "center", justifyContent: "center", flexWrap: "wrap", minHeight: 120 }}>
        <Button type="primary" size="default" text="Copy" iconRight={copyIcon} fitContent />
        <Button type="ghost" size="default" text="" iconLeft={copyIcon} fitContent />
        <Button type="ghost" size="small" text="ch_8f3a91b2" iconRight={copyIcon} fitContent />
        <Button type="ghost" size="small" text="12345" iconRight={copyIcon} fitContent />
      </div>
    </DemoStage>
  );
}
