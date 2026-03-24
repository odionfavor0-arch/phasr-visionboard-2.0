import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase, Heart, Sparkles, CheckCircle, TrendingUp,
  Edit3, Save, Upload, Plus, Trash2, ChevronDown, ChevronUp,
  Download, X, Star, Smile
} from 'lucide-react';

/* ─── Fonts + Global CSS ─── */
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --p50:#fff5f7; --p100:#ffe4eb; --p200:#ffccd8; --p300:#ffaabf;
      --p400:#ff80a0; --p500:#f95f85; --p600:#e83d66; --p700:#c0244d;
      --blush:#fde8ee; --rose:#f8d0dc; --cream:#fffbfc;
      --muted:#7a5a66; --text:#3d1f2b; --border:#f2c4d0;
      --sh: 0 4px 24px rgba(233,100,136,.10);
      --sh2:0 8px 32px rgba(233,100,136,.18);
      --t:.32s cubic-bezier(.4,0,.2,1);
      --r:18px; --rs:12px;
    }

    html { font-size: 15px; }
    body {
      font-family:'DM Sans',sans-serif; background:var(--cream);
      color:var(--text); -webkit-font-smoothing:antialiased;
    }
    ::-webkit-scrollbar{width:5px;height:5px}
    ::-webkit-scrollbar-track{background:var(--p50)}
    ::-webkit-scrollbar-thumb{background:var(--p300);border-radius:99px}

    /* ── Background ── */
    .vb-root {
      min-height:100vh;
      background:
        radial-gradient(ellipse 80% 55% at 5% 0%,  #ffd6e2 0%, transparent 55%),
        radial-gradient(ellipse 60% 40% at 95% 100%,#fce4ec 0%, transparent 50%),
        var(--cream);
      background-attachment:fixed;
      padding:2rem 1rem 4rem;
      position:relative;
    }
    /* Bow / teddy print */
    .vb-root::before {
      content:'';
      position:fixed; inset:0; pointer-events:none; z-index:0;
      background-image:
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 90 60' width='90' height='60'%3E%3Cpath d='M6 4 Q22 4 32 30 Q22 56 6 56 Q16 38 16 30 Q16 22 6 4Z' fill='rgba(255,182,193,0.09)'/%3E%3Cpath d='M84 4 Q68 4 58 30 Q68 56 84 56 Q74 38 74 30 Q74 22 84 4Z' fill='rgba(255,182,193,0.09)'/%3E%3Cellipse cx='45' cy='30' rx='7' ry='9' fill='rgba(255,160,180,0.11)'/%3E%3C/svg%3E"),
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' width='20' height='20'%3E%3Ccircle cx='10' cy='10' r='3' fill='rgba(255,182,193,0.08)'/%3E%3C/svg%3E");
      background-size: 90px 60px, 40px 40px;
      background-position: 0 0, 45px 30px;
      opacity:.7;
    }

    .vb-inner { max-width:1240px; margin:0 auto; position:relative; z-index:1; }

    /* ── Header ── */
    .vb-header { text-align:center; margin-bottom:2rem; }
    .vb-title {
      font-family:'Playfair Display',serif;
      font-size:clamp(1.8rem,5vw,3rem); font-weight:700; line-height:1.15;
      background:linear-gradient(135deg,var(--p600) 0%,#c7507a 45%,#a03060 100%);
      -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    }
    .vb-title-input {
      font-family:'Playfair Display',serif;
      font-size:clamp(1.4rem,4vw,2.2rem); font-weight:700; color:var(--p600);
      background:transparent; border:none; border-bottom:2px solid var(--p300);
      text-align:center; width:100%; max-width:560px; outline:none;
      padding:.25rem .5rem; transition:border-color var(--t);
    }
    .vb-title-input:focus { border-color:var(--p500); }
    .vb-subtitle {
      color:var(--muted); font-size:.85rem; font-weight:500;
      letter-spacing:.1em; text-transform:uppercase; margin-top:.4rem;
    }
    /* Tiny cute personalise pill */
    .vb-edit-pill {
      display:inline-flex; align-items:center; gap:.35rem;
      padding:.38rem 1rem; border-radius:99px; border:1.5px solid var(--p300);
      font-size:.75rem; font-weight:600; letter-spacing:.06em; text-transform:lowercase;
      cursor:pointer; transition:all var(--t); margin-top:.9rem;
      font-family:'DM Sans',sans-serif;
    }
    .vb-edit-pill.viewing {
      background:var(--p50); color:var(--p600);
    }
    .vb-edit-pill.viewing:hover { background:var(--p100); border-color:var(--p500); }
    .vb-edit-pill.editing {
      background:linear-gradient(135deg,#65c47c,#3da85a);
      color:#fff; border-color:transparent;
      box-shadow:0 3px 12px rgba(61,168,90,.25);
    }

    /* ── Phase Tabs ── */
    .vb-tabs { display:flex; gap:.6rem; justify-content:center; flex-wrap:wrap; margin-bottom:1.6rem; }
    .vb-tab {
      padding:.55rem 1.2rem; border-radius:99px;
      border:1.5px solid var(--border); background:#fff;
      cursor:pointer; font-size:.8rem; font-weight:600; color:var(--muted);
      transition:all var(--t); text-align:center; position:relative;
      font-family:'DM Sans',sans-serif;
    }
    .vb-tab:hover { background:var(--p50); border-color:var(--p300); color:var(--p600); }
    .vb-tab.active {
      background:linear-gradient(135deg,var(--p400),var(--p600));
      border-color:transparent; color:#fff;
      box-shadow:0 4px 14px rgba(233,100,136,.28);
    }
    .vb-tab-period { display:block; font-size:.68rem; font-weight:400; opacity:.85; margin-top:1px; }
    .vb-tab-del {
      position:absolute; top:-5px; right:-5px;
      width:17px; height:17px; border-radius:50%;
      background:#fff; border:1.5px solid var(--p300); color:var(--p500);
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; font-size:.65rem; transition:all var(--t);
    }
    .vb-tab-del:hover { background:var(--p500); color:#fff; border-color:var(--p500); }
    .vb-add-tab {
      padding:.55rem 1.1rem; border-radius:99px;
      border:1.5px dashed var(--p300); background:transparent;
      cursor:pointer; font-size:.78rem; font-weight:600; color:var(--p400);
      transition:all var(--t); display:flex; align-items:center; gap:.35rem;
      font-family:'DM Sans',sans-serif;
    }
    .vb-add-tab:hover { background:var(--p50); border-color:var(--p500); color:var(--p600); }
    /* Delete confirm */
    .vb-del-confirm {
      position:absolute; top:110%; left:50%; transform:translateX(-50%);
      background:#fff; border:1.5px solid var(--p300); border-radius:12px;
      padding:.6rem .9rem; z-index:100; white-space:nowrap;
      box-shadow:0 4px 20px rgba(233,100,136,.2);
      display:flex; flex-direction:column; align-items:center; gap:.5rem;
    }
    .vb-del-confirm p { font-size:.75rem; color:var(--text); font-weight:500; }
    .vb-del-confirm-btns { display:flex; gap:.5rem; }
    .vb-btn-yes { padding:.28rem .8rem; border-radius:99px; border:none; background:var(--p500); color:#fff; font-size:.72rem; font-weight:600; cursor:pointer; transition:all var(--t); }
    .vb-btn-yes:hover { background:var(--p600); }
    .vb-btn-no  { padding:.28rem .8rem; border-radius:99px; border:1.5px solid var(--border); background:#fff; color:var(--muted); font-size:.72rem; font-weight:600; cursor:pointer; transition:all var(--t); }
    .vb-btn-no:hover  { border-color:var(--p400); color:var(--p600); }

    /* ── Affirmation ── */
    .vb-affirmation {
      background:linear-gradient(135deg,#fff5f7,#fef0f8);
      border:1.5px solid var(--p200); border-radius:var(--rs);
      padding:1rem 1.4rem; margin-bottom:1.4rem; text-align:center;
      position:relative; overflow:hidden;
    }
    .vb-affirmation::before {
      content:'"'; position:absolute; top:-10px; left:10px;
      font-family:'Playfair Display',serif; font-size:5rem; color:var(--p200);
      line-height:1; pointer-events:none;
    }
    .vb-affirmation-text {
      font-family:'Playfair Display',serif; font-style:italic;
      font-size:clamp(.9rem,2.2vw,1.1rem); color:var(--p700);
      position:relative; z-index:1;
    }
    .vb-affirmation-input {
      font-family:'Playfair Display',serif; font-style:italic;
      font-size:1rem; color:var(--p700);
      background:transparent; border:none; border-bottom:1.5px solid var(--p300);
      text-align:center; width:100%; outline:none;
      padding:.3rem .5rem; transition:border-color var(--t); position:relative; z-index:1;
    }
    .vb-affirmation-input:focus { border-color:var(--p500); }

    /* ── Mobile Pillar Tabs ── */
    .vb-pillar-mobile-tabs {
      display:none; gap:.5rem; margin-bottom:1rem;
      overflow-x:auto; padding-bottom:.3rem;
    }
    .vb-pillar-mtab {
      flex-shrink:0; padding:.5rem 1rem; border-radius:99px;
      border:1.5px solid var(--border); background:#fff;
      cursor:pointer; font-size:.78rem; font-weight:600; color:var(--muted);
      transition:all var(--t); font-family:'DM Sans',sans-serif;
      display:flex; align-items:center; gap:.35rem;
    }
    .vb-pillar-mtab.active {
      background:linear-gradient(135deg,var(--p300),var(--p500));
      border-color:transparent; color:#fff;
    }

    /* ── Pillars Grid ── */
    .vb-pillars {
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:1.1rem; margin-bottom:1.5rem;
    }
    @media(max-width:900px){
      .vb-pillars { grid-template-columns:repeat(3,1fr); gap:.7rem; }
    }
    @media(max-width:640px){
      .vb-pillar-mobile-tabs { display:flex; }
      .vb-pillars { grid-template-columns:1fr; }
      .vb-card.mobile-hidden { display:none; }
    }

    /* ── Pillar Card ── */
    .vb-card {
      background:#fff; border-radius:var(--r);
      border:1px solid var(--border); box-shadow:var(--sh);
      overflow:hidden; transition:box-shadow var(--t), transform var(--t);
    }
    .vb-card:hover { box-shadow:var(--sh2); transform:translateY(-2px); }
    .vb-card-header {
      background:linear-gradient(135deg,var(--p50),var(--blush));
      border-bottom:1px solid var(--border);
      padding:.9rem 1.1rem;
      display:flex; align-items:center; gap:.65rem; cursor:pointer;
    }
    .vb-card-icon {
      width:36px; height:36px; border-radius:10px; flex-shrink:0;
      background:linear-gradient(135deg,var(--p300),var(--p500));
      display:flex; align-items:center; justify-content:center; color:#fff;
    }
    .vb-card-emoji { font-size:1.05rem; line-height:1; }
    .vb-card-title {
      font-family:'Playfair Display',serif;
      font-size:1rem; font-weight:600; color:var(--text); flex:1;
    }
    .vb-card-title-input {
      font-family:'Playfair Display',serif; font-size:.95rem; font-weight:600;
      background:transparent; border:none; border-bottom:1.5px solid var(--p300);
      color:var(--text); outline:none; width:100%; padding:0; flex:1;
    }
    .vb-card-actions { display:flex; align-items:center; gap:.4rem; flex-shrink:0; }
    .vb-collapse-icon { color:var(--p400); transition:color var(--t); }
    .vb-card-header:hover .vb-collapse-icon { color:var(--p600); }
    .vb-card-body { padding:1rem; display:flex; flex-direction:column; gap:.9rem; }

    /* ── Before/After ── */
    .vb-ba { display:grid; grid-template-columns:1fr 1fr; gap:.65rem; }
    .vb-ba-box { border-radius:var(--rs); padding:.75rem; border:1px solid; }
    .vb-ba-box.before { background:#fff8f8; border-color:#f9cdd3; }
    .vb-ba-box.after  { background:#f4fbf5; border-color:#b9dfc0; }
    .vb-ba-lbl { font-size:.68rem; font-weight:700; letter-spacing:.09em; text-transform:uppercase; margin-bottom:.45rem; }
    .vb-ba-box.before .vb-ba-lbl { color:#c0445a; }
    .vb-ba-box.after  .vb-ba-lbl { color:#3a7d4d; }
    .vb-img-slot {
      width:100%; aspect-ratio:4/3; border-radius:8px;
      background:var(--p50); border:2px dashed var(--border);
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      margin-bottom:.45rem; overflow:hidden; position:relative;
      transition:background var(--t), border-color var(--t);
    }
    .vb-img-slot.editable { cursor:pointer; }
    .vb-img-slot.editable:hover { background:var(--p100); border-color:var(--p400); }
    .vb-img-slot img { width:100%; height:100%; object-fit:cover; }
    .vb-img-overlay {
      position:absolute; inset:0; background:rgba(249,95,133,.5);
      display:flex; align-items:center; justify-content:center;
      opacity:0; transition:opacity var(--t);
    }
    .vb-img-slot:hover .vb-img-overlay { opacity:1; }
    .vb-img-ph { color:var(--p300); font-size:.68rem; text-align:center; padding:.4rem; }

    /* ── Section labels ── */
    .vb-slbl {
      font-size:.68rem; font-weight:700; letter-spacing:.1em;
      text-transform:uppercase; margin-bottom:.45rem;
      display:flex; align-items:center; gap:.3rem;
    }
    .blue   { color:#4a7fc1; } .orange { color:#d4773a; }
    .green  { color:#3d9158; } .purple { color:#7a58b0; }
    .rose   { color:var(--p600); }

    /* ── Lists ── */
    .vb-list { display:flex; flex-direction:column; gap:.28rem; }
    .vb-list-row {
      display:flex; align-items:flex-start; gap:.45rem;
      font-size:.8rem; color:#5a3d47; line-height:1.5;
      padding:.28rem .45rem; border-radius:8px;
      transition:background var(--t); cursor:default;
    }
    .vb-list-row:hover { background:var(--p50); }
    .vb-list-row .mk { color:var(--p400); flex-shrink:0; font-size:.65rem; margin-top:3px; }

    /* ── Checklist ── */
    .vb-checklist {
      background:linear-gradient(135deg,var(--p50),#fff5f0);
      border:1.5px solid var(--p200); border-radius:var(--rs); padding:.8rem;
    }
    .vb-chk-row {
      display:flex; align-items:flex-start; gap:.55rem;
      padding:.3rem .35rem; border-radius:8px;
      transition:background var(--t); cursor:pointer;
    }
    .vb-chk-row:hover { background:var(--p100); }
    .vb-chk-row input[type=checkbox] {
      width:15px; height:15px; border-radius:4px; margin-top:2px;
      cursor:pointer; accent-color:var(--p500); flex-shrink:0;
    }
    .vb-chk-txt { font-size:.8rem; color:#5a3d47; line-height:1.5; flex:1; transition:color var(--t); }
    .vb-chk-txt.done { text-decoration:line-through; color:#c4a0ac; }
    .vb-ghost-del {
      background:none; border:none; cursor:pointer; padding:2px; border-radius:4px;
      color:transparent; display:flex; flex-shrink:0;
      transition:color var(--t);
    }
    .vb-chk-row:hover .vb-ghost-del { color:#e0a0a8; }
    .vb-ghost-del:hover { color:#c04455 !important; }

    /* ── Outcomes ── */
    .vb-outcomes { display:flex; flex-direction:column; gap:.45rem; }
    .vb-outcome {
      background:linear-gradient(135deg,#faf0f5,#f5ebff);
      border:1px solid #e8d0f0; border-radius:10px;
      padding:.55rem .75rem;
    }
    .vb-outcome-lbl { font-size:.66rem; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:#9060b0; margin-bottom:.18rem; }
    .vb-outcome-val { font-size:.8rem; color:#5a3d60; line-height:1.5; }

    /* ── Inputs ── */
    .vb-inp {
      width:100%; padding:.4rem .6rem; border:1.5px solid var(--p200);
      border-radius:8px; font-family:'DM Sans',sans-serif; font-size:.8rem;
      color:var(--text); background:#fff; outline:none;
      transition:border-color var(--t), box-shadow var(--t); margin-bottom:.3rem;
    }
    .vb-inp:focus { border-color:var(--p400); box-shadow:0 0 0 3px rgba(249,95,133,.1); }
    .vb-ta {
      width:100%; padding:.45rem .6rem; border:1.5px solid var(--p200);
      border-radius:8px; font-family:'DM Sans',sans-serif; font-size:.8rem;
      color:var(--text); background:#fff; outline:none;
      resize:vertical; min-height:60px;
      transition:border-color var(--t), box-shadow var(--t);
    }
    .vb-ta:focus { border-color:var(--p400); box-shadow:0 0 0 3px rgba(249,95,133,.1); }
    .vb-btn-add {
      display:inline-flex; align-items:center; gap:.3rem;
      font-size:.72rem; font-weight:600; color:var(--p500);
      background:var(--p50); border:1.5px dashed var(--p300);
      border-radius:6px; padding:.28rem .65rem; cursor:pointer;
      transition:all var(--t); margin-top:.25rem;
      font-family:'DM Sans',sans-serif;
    }
    .vb-btn-add:hover { background:var(--p100); border-color:var(--p500); }
    .vb-btn-del {
      background:none; border:none; cursor:pointer; color:#e0a0a8;
      padding:2px; border-radius:4px; display:flex;
      transition:color var(--t); flex-shrink:0;
    }
    .vb-btn-del:hover { color:#c04455; }

    .vb-divider { height:1px; background:linear-gradient(to right,transparent,var(--border),transparent); margin:.2rem 0; }

    /* ── Add Custom Pillar ── */
    .vb-add-pillar {
      border:2px dashed var(--p300); border-radius:var(--r);
      display:flex; flex-direction:column; align-items:center;
      justify-content:center; gap:.6rem; padding:1.8rem 1rem;
      cursor:pointer; transition:all var(--t); background:transparent;
      font-family:'DM Sans',sans-serif;
    }
    .vb-add-pillar:hover { background:var(--p50); border-color:var(--p500); }
    .vb-add-pillar span { font-size:.82rem; font-weight:600; color:var(--p500); }

    /* ── SCROLL / RIBBON — Ultimate Impact ── */
    .vb-scroll-wrap {
      margin:2rem 0 1.5rem;
      display:flex; justify-content:center;
    }
    .vb-scroll {
      background:#fffbfc; border-radius:6px;
      position:relative; padding:2.2rem 3.5rem;
      text-align:center; width:100%; max-width:820px;
      /* double border = ribbon feel */
      box-shadow:
        0 0 0 1.5px var(--p200),
        0 0 0 5px var(--p50),
        0 0 0 6.5px var(--p200),
        0 12px 40px rgba(233,100,136,.14);
    }
    /* Ribbon notch ears */
    .vb-scroll::before, .vb-scroll::after {
      content:''; position:absolute; top:50%; transform:translateY(-50%);
      width:0; height:0; z-index:2;
    }
    .vb-scroll::before {
      left:-18px;
      border-top:22px solid transparent;
      border-bottom:22px solid transparent;
      border-right:18px solid #fffbfc;
      filter:drop-shadow(-3px 0 2px rgba(233,100,136,.15));
    }
    .vb-scroll::after {
      right:-18px;
      border-top:22px solid transparent;
      border-bottom:22px solid transparent;
      border-left:18px solid #fffbfc;
      filter:drop-shadow(3px 0 2px rgba(233,100,136,.15));
    }
    .vb-scroll-crown {
      font-size:2rem; margin-bottom:.5rem; display:block;
      animation:float 3s ease-in-out infinite;
    }
    @keyframes float {
      0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)}
    }
    @keyframes foil {
      0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%}
    }
    .vb-scroll-title {
      font-family:'Playfair Display',serif;
      font-size:clamp(1.2rem,3vw,1.7rem); font-weight:700;
      letter-spacing:.06em;
      background:linear-gradient(90deg,
        #ff6b9d,#ffb3c6,#fff0f5,#ffa0bc,
        #ff6b9d,#e85d90,#ff85a8,#ff6b9d);
      background-size:300% auto;
      -webkit-background-clip:text; -webkit-text-fill-color:transparent;
      background-clip:text;
      animation:foil 4s linear infinite;
      margin-bottom:.75rem;
    }
    .vb-scroll-text { font-size:.95rem; color:#7a3a55; line-height:1.7; font-weight:500; }
    .vb-scroll-dec {
      display:flex; align-items:center; justify-content:center; gap:.7rem; margin:.6rem 0;
    }
    .vb-scroll-line { flex:1; height:1px; background:linear-gradient(to right,transparent,var(--p300)); max-width:80px; }
    .vb-scroll-line.r { background:linear-gradient(to left,transparent,var(--p300)); }

    /* ── Review ── */
    .vb-review {
      background:#fff; border-radius:var(--r);
      border:1px solid var(--border); box-shadow:var(--sh); overflow:hidden;
    }
    .vb-review-hd {
      background:linear-gradient(135deg,#fff8e6,#fff0d6);
      border-bottom:1px solid #f5d9a0; padding:1rem 1.4rem;
      display:flex; align-items:center; gap:.65rem;
    }
    .vb-review-icon {
      width:36px; height:36px; border-radius:10px; flex-shrink:0;
      background:linear-gradient(135deg,#f5b942,#e8930a);
      display:flex; align-items:center; justify-content:center; color:#fff;
    }
    .vb-review-title {
      font-family:'Playfair Display',serif; font-size:1rem; font-weight:600; color:#7a4a00;
    }
    .vb-review-body {
      padding:1.1rem; display:grid;
      grid-template-columns:repeat(3,1fr); gap:.9rem;
    }
    @media(max-width:640px){
      .vb-review-body { grid-template-columns:1fr; }
    }
    .vb-r-card {
      border-radius:var(--rs); padding:.8rem; border:1px solid;
      transition:filter var(--t);
    }
    .vb-r-card.g { background:#f4fbf5; border-color:#b9dfc0; }
    .vb-r-card.r { background:#fff8f8; border-color:#f9cdd3; }
    .vb-r-card.b { background:#f2f6ff; border-color:#c5d5f7; }
    .vb-r-card:hover { filter:brightness(.98); }
    .vb-r-lbl { font-size:.68rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; margin-bottom:.35rem; }
    .vb-r-card.g .vb-r-lbl { color:#3a7d4d; }
    .vb-r-card.r .vb-r-lbl { color:#c0445a; }
    .vb-r-card.b .vb-r-lbl { color:#3355a0; }
    .vb-r-hint { font-size:.7rem; color:#8a7080; margin-bottom:.4rem; }
    .vb-review-strategy {
      margin:0 1.1rem 1.1rem;
      border-radius:var(--rs); padding:.8rem;
      background:linear-gradient(135deg,#faf0f5,#f5ebff);
      border:1px solid #e8d0f0;
    }
    .vb-review-strategy .vb-r-lbl { color:#7a58b0; }

    /* ── Export / Footer ── */
    .vb-footer { text-align:center; margin-top:2.2rem; }
    .vb-export-btn {
      display:inline-flex; align-items:center; gap:.5rem;
      padding:.55rem 1.4rem; border-radius:99px;
      border:1.5px solid var(--p300); background:#fff; color:var(--p600);
      font-size:.78rem; font-weight:600; cursor:pointer;
      transition:all var(--t); margin-bottom:.8rem;
      font-family:'DM Sans',sans-serif;
    }
    .vb-export-btn:hover { background:var(--p50); border-color:var(--p500); }
    .vb-footer-txt { color:var(--muted); font-size:.8rem; }
    .vb-heart { color:var(--p500); }

    /* ── Print ── */
    @media print {
      .vb-edit-pill,.vb-tabs,.vb-export-btn,.vb-tab-del,
      .vb-btn-add,.vb-btn-del,.vb-ghost-del,
      .vb-collapse-icon,.vb-add-pillar,.vb-affirmation-input { display:none!important; }
      .vb-root::before { display:none; }
      .vb-card.mobile-hidden { display:block!important; }
      .vb-pillars { grid-template-columns:repeat(3,1fr)!important; }
    }

    @media(max-width:640px){
      .vb-scroll { padding:1.8rem 2rem; }
      .vb-scroll::before, .vb-scroll::after { display:none; }
    }

    .vb-phase-name-inp {
      font-size:.8rem; font-weight:600; font-family:'DM Sans',sans-serif;
      background:rgba(255,255,255,.3); border:1px solid rgba(255,255,255,.6);
      color:#fff; border-radius:6px; padding:.2rem .4rem;
      outline:none; width:100%; margin-bottom:.15rem;
    }
    .vb-phase-period-inp {
      font-size:.68rem; font-family:'DM Sans',sans-serif;
      background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.5);
      color:rgba(255,255,255,.9); border-radius:6px; padding:.15rem .4rem;
      outline:none; width:100%;
    }
  `}</style>
);

/* ─── Helpers ─── */
const uid = () => Math.random().toString(36).slice(2,9);

const freshPillar = (emoji='💡', name='New Pillar') => ({
  id: uid(), emoji, name,
  beforeImage:null, afterImage:null,
  beforeState:'Current state...', beforeDesc:'Where I am now',
  afterState:'Goal state...', afterDesc:'Where I want to be',
  resources:['Resource 1'],
  activities:['Activity 1'],
  outputs:['Output 1'],
  weeklyActions:['Weekly action 1'],
  shortOutcome:'Short-term outcome',
  mediumOutcome:'Medium-term outcome',
  longOutcome:'Long-term outcome',
});

const freshPhase = (n) => ({
  id: uid(),
  name:`Phase ${n}`,
  period:`Q${n}`,
  affirmation:'I am becoming the woman I was always meant to be ✨',
  pillars:[
    freshPillar('💼','Work & Career'),
    freshPillar('💪','Personal Life'),
    freshPillar('✨','Spiritual Growth'),
  ],
  impact:'Write your ultimate transformation statement here — who will you become? 👑',
  reviewWorked:'', reviewDrained:'', reviewPaid:'', reviewStrategy:'',
});

const DEFAULT = {
  boardTitle:'My Vision Board',
  phases:[ freshPhase(1) ],
};

/* ─── Main Component ─── */
export default function VisionBoard() {
  const boardRef = useRef(null);

  const [data, setData]         = useState(() => { try { const s=localStorage.getItem('vb_v3'); return s?JSON.parse(s):DEFAULT; } catch{return DEFAULT;} });
  const [edit, setEdit]         = useState(false);
  const [phaseId, setPhaseId]   = useState(() => { try { const s=localStorage.getItem('vb_v3'); const d=s?JSON.parse(s):DEFAULT; return d.phases[0]?.id||''; } catch{return '';} });
  const [checked, setChecked]   = useState({});
  const [collapsed, setCollapsed]= useState({});
  const [delConfirm, setDelConfirm]= useState(null); // phase id to confirm delete
  const [mobilePillar, setMobilePillar]= useState({}); // {phaseId: pillarId}

  useEffect(()=>{ localStorage.setItem('vb_v3', JSON.stringify(data)); }, [data]);

  // Load html2canvas for export
  useEffect(()=>{
    if(document.getElementById('h2c-script')) return;
    const s=document.createElement('script');
    s.id='h2c-script';
    s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    document.head.appendChild(s);
  }, []);

  const phase = data.phases.find(p=>p.id===phaseId) || data.phases[0];
  const activeMPillarId = mobilePillar[phase?.id] || phase?.pillars?.[0]?.id;

  /* ── Setters ── */
  const setBoard = (fn) => setData(d=>({...d,...fn(d)}));
  const setP = (pid,fn) => setData(d=>({...d, phases:d.phases.map(p=>p.id===pid?{...p,...fn(p)}:p)}));
  const setPillar = (pid,plid,fn) => setP(pid, p=>({ pillars:p.pillars.map(pl=>pl.id===plid?{...pl,...fn(pl)}:pl) }));
  const setArr = (pid,plid,key,fn) => setPillar(pid,plid, pl=>({[key]:fn(pl[key])}));

  const addPhase = () => {
    const p = freshPhase(data.phases.length+1);
    setData(d=>({...d, phases:[...d.phases,p]}));
    setPhaseId(p.id);
  };
  const deletePhase = (pid) => {
    if(data.phases.length<=1) return;
    setData(d=>{
      const phases = d.phases.filter(p=>p.id!==pid);
      return {...d, phases};
    });
    setDelConfirm(null);
    setPhaseId(p=> p===pid ? data.phases.find(p=>p.id!==pid)?.id||'' : p);
  };
  const addPillar = (pid) => {
    const pl = freshPillar('💡',`Pillar ${(phase?.pillars?.length||0)+1}`);
    setP(pid, p=>({ pillars:[...p.pillars, pl] }));
  };
  const delPillar = (pid,plid) => setP(pid, p=>({ pillars:p.pillars.filter(pl=>pl.id!==plid) }));

  const uploadImg = (pid,plid,slot) => {
    const inp=document.createElement('input');
    inp.type='file'; inp.accept='image/*';
    inp.onchange=e=>{
      const f=e.target.files[0]; if(!f) return;
      const r=new FileReader();
      r.onload=ev=>setPillar(pid,plid,()=>({[slot]:ev.target.result}));
      r.readAsDataURL(f);
    };
    inp.click();
  };

  const doExport = () => {
    if(!window.html2canvas){ window.print(); return; }
    const el = document.getElementById('vb-export-target');
    if(!el) return;
    window.html2canvas(el,{scale:2,useCORS:true,backgroundColor:'#fffbfc'}).then(canvas=>{
      const a=document.createElement('a');
      a.download='vision-board.png'; a.href=canvas.toDataURL('image/png'); a.click();
    });
  };

  /* ── Sub-components ── */
  const ImgSlot = ({pid,plid,slot,src}) => (
    <div className={`vb-img-slot ${edit?'editable':''}`}
      onClick={()=>edit&&uploadImg(pid,plid,slot)}>
      {src ? <>
        <img src={src} alt="" />
        {edit && <div className="vb-img-overlay"><Upload size={20} color="#fff"/></div>}
      </> : <div className="vb-img-ph">
        <Upload size={16} style={{margin:'0 auto 3px',display:'block',color:'var(--p300)'}}/>
        {edit?'tap to upload':'add photo'}
      </div>}
    </div>
  );

  const EditList = ({pid,plid,akey,marker='•'}) => {
    const pl = phase?.pillars?.find(p=>p.id===plid);
    if(!pl) return null;
    return (
      <div className="vb-list">
        {pl[akey].map((item,i)=>(
          <div key={i} className="vb-list-row">
            {edit ? <>
              <input className="vb-inp" style={{flex:1,marginBottom:0}} value={item}
                onChange={e=>setArr(pid,plid,akey,a=>a.map((v,j)=>j===i?e.target.value:v))}/>
              <button className="vb-btn-del"
                onClick={()=>setArr(pid,plid,akey,a=>a.filter((_,j)=>j!==i))}>
                <Trash2 size={11}/>
              </button>
            </> : <>
              <span className="mk">{marker}</span>
              <span style={{flex:1}}>{item}</span>
            </>}
          </div>
        ))}
        {edit && <button className="vb-btn-add"
          onClick={()=>setArr(pid,plid,akey,a=>[...a,''])}>
          <Plus size={10}/> add item
        </button>}
      </div>
    );
  };

  const PillarCard = ({pl}) => {
    if(!pl||!phase) return null;
    const pid=phase.id; const plid=pl.id;
    const ck = `${pid}-${plid}`;
    const isCollapsed = collapsed[ck];
    const isMobileActive = activeMPillarId===plid;

    return (
      <div className={`vb-card ${!isMobileActive?'mobile-hidden':''}`}
        style={{...(isMobileActive?{}:{})}}>
        {/* Header */}
        <div className="vb-card-header"
          onClick={()=>setCollapsed(c=>({...c,[ck]:!c[ck]}))}>
          <div className="vb-card-icon">
            <span className="vb-card-emoji">{pl.emoji}</span>
          </div>
          {edit
            ? <input className="vb-card-title-input" value={pl.name}
                onClick={e=>e.stopPropagation()}
                onChange={e=>setPillar(pid,plid,()=>({name:e.target.value}))}/>
            : <span className="vb-card-title">{pl.name}</span>
          }
          <div className="vb-card-actions">
            {edit && phase.pillars.length>1 && (
              <button className="vb-btn-del"
                onClick={e=>{e.stopPropagation();delPillar(pid,plid);}}>
                <Trash2 size={13}/>
              </button>
            )}
            <span className="vb-collapse-icon">
              {isCollapsed?<ChevronDown size={15}/>:<ChevronUp size={15}/>}
            </span>
          </div>
        </div>

        {!isCollapsed && (
          <div className="vb-card-body">
            {/* Before / After */}
            <div className="vb-ba">
              <div className="vb-ba-box before">
                <p className="vb-ba-lbl">📸 Before</p>
                <ImgSlot pid={pid} plid={plid} slot="beforeImage" src={pl.beforeImage}/>
                {edit
                  ? <>
                      <input className="vb-inp" value={pl.beforeState}
                        onChange={e=>setPillar(pid,plid,()=>({beforeState:e.target.value}))}
                        placeholder="Before state"/>
                      <input className="vb-inp" value={pl.beforeDesc}
                        onChange={e=>setPillar(pid,plid,()=>({beforeDesc:e.target.value}))}
                        placeholder="Description" style={{fontSize:'.72rem',color:'#9a7080'}}/>
                    </>
                  : <>
                      <p style={{fontSize:'.78rem',color:'#5a3d47',lineHeight:1.5}}>{pl.beforeState}</p>
                      <p style={{fontSize:'.72rem',color:'#9a7080',marginTop:2}}>{pl.beforeDesc}</p>
                    </>
                }
              </div>
              <div className="vb-ba-box after">
                <p className="vb-ba-lbl">🎯 After</p>
                <ImgSlot pid={pid} plid={plid} slot="afterImage" src={pl.afterImage}/>
                {edit
                  ? <>
                      <input className="vb-inp" value={pl.afterState}
                        onChange={e=>setPillar(pid,plid,()=>({afterState:e.target.value}))}
                        placeholder="Goal state"/>
                      <input className="vb-inp" value={pl.afterDesc}
                        onChange={e=>setPillar(pid,plid,()=>({afterDesc:e.target.value}))}
                        placeholder="Description" style={{fontSize:'.72rem',color:'#5a8060'}}/>
                    </>
                  : <>
                      <p style={{fontSize:'.78rem',color:'#2d5a3d',lineHeight:1.5}}>{pl.afterState}</p>
                      <p style={{fontSize:'.72rem',color:'#5a8060',marginTop:2}}>{pl.afterDesc}</p>
                    </>
                }
              </div>
            </div>
            <div className="vb-divider"/>

            {/* Resources */}
            <div><p className="vb-slbl blue">💼 Resources</p>
              <EditList pid={pid} plid={plid} akey="resources" marker="◦"/></div>

            {/* Activities */}
            <div><p className="vb-slbl orange">⚡ Activities</p>
              <EditList pid={pid} plid={plid} akey="activities" marker="→"/></div>

            {/* Weekly Non-Negotiables */}
            <div className="vb-checklist">
              <p className="vb-slbl rose" style={{marginBottom:'.55rem'}}>
                <CheckCircle size={12}/> Weekly Non-Negotiables
              </p>
              <div className="vb-list">
                {pl.weeklyActions.map((item,i)=>{
                  const k=`${pid}-${plid}-wk-${i}`;
                  return (
                    <div key={i} className="vb-chk-row"
                      onClick={()=>!edit&&setChecked(c=>({...c,[k]:!c[k]}))}>
                      <input type="checkbox" checked={!!checked[k]}
                        onChange={()=>setChecked(c=>({...c,[k]:!c[k]}))}
                        onClick={e=>e.stopPropagation()}/>
                      {edit
                        ? <>
                            <input className="vb-inp" style={{flex:1,marginBottom:0}} value={item}
                              onChange={e=>setArr(pid,plid,'weeklyActions',a=>a.map((v,j)=>j===i?e.target.value:v))}
                              onClick={e=>e.stopPropagation()}/>
                            <button className="vb-btn-del"
                              onClick={e=>{e.stopPropagation();setArr(pid,plid,'weeklyActions',a=>a.filter((_,j)=>j!==i));}}>
                              <Trash2 size={11}/>
                            </button>
                          </>
                        : <>
                            <span className={`vb-chk-txt ${checked[k]?'done':''}`}>{item}</span>
                            <button className="vb-ghost-del"><Trash2 size={11}/></button>
                          </>
                      }
                    </div>
                  );
                })}
                {edit && <button className="vb-btn-add"
                  onClick={()=>setArr(pid,plid,'weeklyActions',a=>[...a,''])}>
                  <Plus size={10}/> add action
                </button>}
              </div>
            </div>

            {/* Outputs */}
            <div><p className="vb-slbl green">✦ Outputs</p>
              <EditList pid={pid} plid={plid} akey="outputs" marker="✓"/></div>

            {/* Outcomes */}
            <div>
              <p className="vb-slbl purple">📈 Outcomes</p>
              <div className="vb-outcomes">
                {[['shortOutcome','Short-term'],['mediumOutcome','Medium-term'],['longOutcome','Long-term']].map(([k,lbl])=>(
                  <div key={k} className="vb-outcome">
                    <p className="vb-outcome-lbl">{lbl}</p>
                    {edit
                      ? <textarea className="vb-ta" rows={2} value={pl[k]}
                          onChange={e=>setPillar(pid,plid,()=>({[k]:e.target.value}))}/>
                      : <p className="vb-outcome-val">{pl[k]}</p>
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if(!phase) return null;

  return (
    <>
      <Styles/>
      <div className="vb-root" id="vb-export-target" ref={boardRef}>
        <div className="vb-inner">

          {/* ── Header ── */}
          <div className="vb-header">
            {edit
              ? <input className="vb-title-input" value={data.boardTitle}
                  onChange={e=>setBoard(()=>({boardTitle:e.target.value}))}/>
              : <h1 className="vb-title">{data.boardTitle} 👑</h1>
            }
            <p className="vb-subtitle">Work · Personal · Spiritual</p>
            <button className={`vb-edit-pill ${edit?'editing':'viewing'}`}
              onClick={()=>setEdit(e=>!e)}>
              {edit?<><Save size={13}/>save</>:<><Edit3 size={13}/>personalise</>}
            </button>
          </div>

          {/* ── Phase Tabs ── */}
          <div className="vb-tabs">
            {data.phases.map(p=>(
              <div key={p.id} style={{position:'relative'}}>
                <button className={`vb-tab ${phaseId===p.id?'active':''}`}
                  onClick={()=>{ setPhaseId(p.id); setDelConfirm(null); }}>
                  {edit && phaseId===p.id
                    ? <div style={{display:'flex',flexDirection:'column',gap:3,minWidth:100}}
                        onClick={e=>e.stopPropagation()}>
                        <input className="vb-phase-name-inp" value={p.name}
                          onChange={e=>setP(p.id,()=>({name:e.target.value}))}/>
                        <input className="vb-phase-period-inp" value={p.period}
                          onChange={e=>setP(p.id,()=>({period:e.target.value}))}/>
                      </div>
                    : <>
                        {p.name}
                        <span className="vb-tab-period">{p.period}</span>
                      </>
                  }
                </button>
                {edit && data.phases.length>1 && (
                  <button className="vb-tab-del"
                    onClick={e=>{e.stopPropagation(); setDelConfirm(delConfirm===p.id?null:p.id);}}>
                    <X size={9}/>
                  </button>
                )}
                {delConfirm===p.id && (
                  <div className="vb-del-confirm">
                    <p>Delete "{p.name}"?</p>
                    <div className="vb-del-confirm-btns">
                      <button className="vb-btn-yes" onClick={()=>deletePhase(p.id)}>Yes, delete</button>
                      <button className="vb-btn-no"  onClick={()=>setDelConfirm(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {edit && (
              <button className="vb-add-tab" onClick={addPhase}>
                <Plus size={13}/> add phase
              </button>
            )}
          </div>

          {/* ── Affirmation ── */}
          <div className="vb-affirmation">
            {edit
              ? <input className="vb-affirmation-input" value={phase.affirmation}
                  onChange={e=>setP(phase.id,()=>({affirmation:e.target.value}))}
                  placeholder="Write your phase mantra..."/>
              : <p className="vb-affirmation-text">{phase.affirmation}</p>
            }
          </div>

          {/* ── Mobile Pillar Tabs ── */}
          <div className="vb-pillar-mobile-tabs">
            {phase.pillars.map(pl=>(
              <button key={pl.id}
                className={`vb-pillar-mtab ${activeMPillarId===pl.id?'active':''}`}
                onClick={()=>setMobilePillar(m=>({...m,[phase.id]:pl.id}))}>
                <span>{pl.emoji}</span> {pl.name}
              </button>
            ))}
          </div>

          {/* ── Pillars Grid ── */}
          <div className="vb-pillars" style={{
            gridTemplateColumns: `repeat(${edit ? Math.min(phase.pillars.length+1,4) : phase.pillars.length}, 1fr)`
          }}>
            {phase.pillars.map(pl=>(
              <PillarCard key={pl.id} pl={pl}
                style={activeMPillarId!==pl.id?{display:'none'}:{}}/>
            ))}
            {edit && (
              <button className="vb-add-pillar" onClick={()=>addPillar(phase.id)}>
                <Plus size={22} color="var(--p400)"/>
                <span>add pillar</span>
              </button>
            )}
          </div>

          {/* ── Ultimate Impact — Scroll/Ribbon ── */}
          <div className="vb-scroll-wrap">
            <div className="vb-scroll">
              <span className="vb-scroll-crown">👑</span>
              <div className="vb-scroll-dec">
                <div className="vb-scroll-line"/>
                <Star size={12} color="var(--p400)" fill="var(--p300)"/>
                <p className="vb-scroll-title">Ultimate Impact</p>
                <Star size={12} color="var(--p400)" fill="var(--p300)"/>
                <div className="vb-scroll-line r"/>
              </div>
              {edit
                ? <textarea className="vb-ta" style={{textAlign:'center',fontStyle:'italic'}}
                    rows={3} value={phase.impact}
                    onChange={e=>setP(phase.id,()=>({impact:e.target.value}))}/>
                : <p className="vb-scroll-text">{phase.impact}</p>
              }
            </div>
          </div>

          {/* ── Quarterly Review ── */}
          <div className="vb-review">
            <div className="vb-review-hd">
              <div className="vb-review-icon"><TrendingUp size={17}/></div>
              <h3 className="vb-review-title">Quarterly Review — {phase.name}</h3>
            </div>
            <div className="vb-review-body">
              {[
                {k:'reviewWorked', c:'g', lbl:'✅ What Worked?',      hint:'What brought results & opportunities?'},
                {k:'reviewDrained',c:'r', lbl:'⚠️ What Drained Me?', hint:'What to drop next phase?'},
                {k:'reviewPaid',   c:'b', lbl:'💰 What Paid Off?',    hint:'What to double down on?'},
              ].map(({k,c,lbl,hint})=>(
                <div key={k} className={`vb-r-card ${c}`}>
                  <p className="vb-r-lbl">{lbl}</p>
                  <p className="vb-r-hint">{hint}</p>
                  <textarea className="vb-ta" rows={4} value={phase[k]}
                    onChange={e=>setP(phase.id,()=>({[k]:e.target.value}))}
                    placeholder="Write here..."/>
                </div>
              ))}
            </div>
            <div className="vb-review-strategy">
              <p className="vb-r-lbl">🎯 Next Phase Strategy</p>
              <p className="vb-r-hint">What will you do MORE of · STOP · START?</p>
              <textarea className="vb-ta" rows={3} value={phase.reviewStrategy}
                onChange={e=>setP(phase.id,()=>({reviewStrategy:e.target.value}))}
                placeholder="Your strategic decisions..."/>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="vb-footer">
            <button className="vb-export-btn" onClick={doExport}>
              <Download size={14}/> save as image
            </button>
            <p className="vb-footer-txt">
              track weekly · review quarterly · transform your life <span className="vb-heart">♥</span>
            </p>
          </div>

        </div>
      </div>
    </>
  );
}