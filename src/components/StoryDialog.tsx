import { useEffect, useRef } from "react";
import Icon from "./Icon";
import "./dialog.css";
export default function StoryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!open) { dialog.close(); return; }
    const previous = document.activeElement as HTMLElement;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; previous?.focus(); };
  }, [open]);
  return <dialog ref={ref} className="detail-dialog" aria-labelledby="story-heading" onCancel={onClose} onClick={e => {
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) onClose();
  }}>
    <button className="dialog-close" aria-label="Close story" onClick={onClose}><Icon name="close" /></button>
    <div className="dialog-body"><span className="dialog-eyebrow">THE GROWINTEK STORY</span><h2 id="story-heading">Ideas to impact.</h2>
      <div className="story-visual" role="img" aria-label="Growintek digital experiences on connected devices" />
      <p className="dialog-intro">We bring creativity, technology and strategy together to help businesses build smarter and grow faster. From an ambitious first idea to a useful digital experience, great work starts with understanding your vision.</p>
      <div className="story-steps">{[["Discover", "Understand your goals."], ["Design", "Give your ideas shape."], ["Build", "Bring the details to life."], ["Grow", "Launch, learn and improve."]].map(([title, text], i) => <div key={title}><span>0{i + 1}</span><h3>{title}</h3><p>{text}</p></div>)}</div>
      <a className="button button-gold" href="/about">Get to know Growintek <Icon name="arrow" /></a>
    </div>
  </dialog>;
}
