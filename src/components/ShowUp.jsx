import { useEffect, useMemo, useRef, useState } from 'react'
import { BriefcaseBusiness, Check, ChevronRight, Dumbbell, HandCoins, HeartHandshake, MessageCircle, Plus, Sparkles, Sprout } from 'lucide-react'
import { calculateUserPoints, getStoredUserLevel } from '../lib/userLevel'
import { getLockInSummary, loadLockInState } from '../lib/lockIn'
import { supabase, supabaseConfigError } from '../lib/supabaseClient'

const SHOW_UP_STYLES = `
.showup-root{
  min-height:100dvh;
  background:var(--bg, #fff8f9);
  color:#4d3142;
  font-family:'DM Sans',sans-serif;
  -webkit-tap-highlight-color:transparent;
  touch-action:manipulation;
  display:flex;
  flex-direction:column;
}
.showup-shell{
  width:100%;
  max-width:1120px;
  margin:0 auto;
  padding:18px 16px 132px;
  box-sizing:border-box;
  flex:1;
  display:flex;
  flex-direction:column;
  min-height:100dvh;
}
.showup-list-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  padding:10px 2px 18px;
}
.showup-list-kicker{
  margin:0;
  font-size:12px;
  letter-spacing:.22em;
  text-transform:uppercase;
  color:#b98097;
  font-weight:600;
}
.showup-create-link{
  border:none;
  background:transparent;
  display:inline-flex;
  align-items:center;
  gap:6px;
  color:#f95f85;
  font-size:16px;
  font-weight:800;
  font-family:'DM Sans',sans-serif;
  cursor:pointer;
  padding:0;
}
.showup-list-panel{
  border:1px solid rgba(232,64,122,0.14);
  border-radius:14px;
  overflow:hidden;
  background:#fff;
  box-shadow:none;
}
.showup-list-row{
  display:grid;
  grid-template-columns:40px minmax(0,1fr) auto;
  align-items:center;
  gap:12px;
  padding:12px 14px;
  min-height:60px;
}
.showup-list-row + .showup-list-row{
  border-top:1px solid rgba(77,49,66,0.08);
}
.showup-list-icon{
  width:36px;
  height:36px;
  border-radius:8px;
  display:grid;
  place-items:center;
  color:#f95f85;
  border:1px solid rgba(249,95,133,0.08);
  box-shadow:none;
}
.showup-list-content{
  min-width:0;
  display:grid;
  gap:2px;
}
.showup-list-card,
.showup-create-form,
.showup-gate-card,
.showup-member-card,
.showup-compose-card,
.showup-feed-card,
.showup-rank-row,
.showup-empty,
.showup-comment-bubble{
  background:transparent;
  border:1px solid rgba(249,95,133,0.25);
  border-radius:14px;
}
.showup-list-name{
  margin:0;
  font-family:'Syne',sans-serif;
  font-size:14px;
  font-weight:700;
  color:#4d3142;
  line-height:1.15;
}
.showup-list-meta{
  margin:0;
  font-size:11px;
  color:#b29cab;
}
.showup-list-action{
  display:flex;
  align-items:center;
  gap:8px;
  white-space:nowrap;
}
.showup-join-pill{
  min-height:30px;
  border-radius:999px;
  min-width:auto;
  padding:5px 14px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  font-size:12px;
  font-weight:800;
  border:1px solid rgba(249,95,133,0.14);
  background:rgba(249,95,133,0.16);
  color:#f95f85;
  font-family:'DM Sans',sans-serif;
  cursor:pointer;
  box-shadow:none;
}
.showup-join-pill.is-joined{
  background:transparent;
  border-color:transparent;
  color:#9a7088;
  min-width:auto;
  padding:5px 0;
}
.showup-join-pill.is-joined svg{
  color:#b5adb2;
}
.showup-list-arrow{
  color:#b88da0;
  flex-shrink:0;
}
.showup-list-state{
  display:inline-flex;
  align-items:center;
  gap:6px;
}
.showup-create-btn,
.showup-join-btn,
.showup-gate-btn,
.showup-header-btn,
.showup-live-pill,
.showup-tab,
.showup-done-btn,
.showup-bell-btn,
.showup-photo-btn,
.showup-post-btn,
.showup-comment-send,
.showup-comment-toggle,
.showup-reaction-chip,
.showup-template-btn,
.showup-sheet-send,
.showup-sheet-cancel{
  border:1px solid rgba(249,95,133,0.25);
  background:transparent;
  transition:all .24s ease;
  font-family:'DM Sans',sans-serif;
  -webkit-tap-highlight-color:transparent;
}
.showup-create-btn,
.showup-join-btn,
.showup-gate-btn,
.showup-post-btn,
.showup-sheet-send,
.showup-tab.is-active,
.showup-checkin-btn{
  border:none;
  background:linear-gradient(135deg,#f95f85,#ff8ca8);
  color:#fff;
}
.showup-create-btn{
  width:100%;
  min-height:46px;
  border-radius:12px;
  font-size:13px;
  font-weight:800;
  cursor:pointer;
  margin-bottom:12px;
}
.showup-create-form,
.showup-gate-card{
  padding:14px;
  display:grid;
  gap:10px;
  margin-bottom:14px;
  background:rgba(255,255,255,0.74);
}
.showup-field{
  display:grid;
  gap:6px;
}
.showup-field-label{
  font-size:12px;
  color:#9a7088;
  font-weight:700;
}
.showup-input,
.showup-select,
.showup-compose-input,
.showup-comment-input,
.showup-sheet-textarea{
  width:100%;
  box-sizing:border-box;
  border:1px solid rgba(249,95,133,0.25);
  background:transparent;
  border-radius:12px;
  padding:12px 13px;
  outline:none;
  color:#4d3142;
  font-family:'DM Sans',sans-serif;
  font-size:13px;
}
.showup-join-footer{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:8px;
}
.showup-join-btn{
  min-height:34px;
  border-radius:999px;
  padding:0 12px;
  font-size:12px;
  font-weight:800;
  cursor:pointer;
}
.showup-gate-title{
  margin:0;
  font-size:16px;
  font-weight:700;
  color:#4d3142;
}
.showup-gate-copy{
  margin:0;
  font-size:12px;
  line-height:1.6;
  color:#9a7088;
}
.showup-gate-actions{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
}
.showup-gate-btn{
  min-height:42px;
  border-radius:12px;
  cursor:pointer;
  font-size:12px;
  font-weight:700;
}
.showup-sticky-header{
  position:sticky;
  top:0;
  z-index:14;
  background:linear-gradient(180deg, rgba(255,248,249,0.98) 0%, rgba(255,248,249,0.94) 100%);
  backdrop-filter:blur(16px);
  padding-bottom:14px;
  margin-bottom:8px;
}
.showup-topbar{
  display:grid;
  grid-template-columns:44px 1fr auto;
  align-items:center;
  gap:10px;
  padding-bottom:14px;
}
.showup-header-btn{
  width:44px;
  height:44px;
  border-radius:10px;
  color:#f95f85;
  display:grid;
  place-items:center;
  font-size:1.15rem;
  cursor:pointer;
  background:rgba(255,255,255,0.86);
}
.showup-room-title{
  margin:0;
  text-align:center;
  font-family:'Syne',sans-serif;
  font-size:16px;
  font-weight:700;
  color:#4d3142;
}
.showup-live-pill{
  display:inline-flex;
  align-items:center;
  gap:8px;
  border-radius:999px;
  padding:10px 13px;
  color:#f95f85;
  font-size:12px;
  font-weight:700;
  white-space:nowrap;
  background:rgba(255,255,255,0.9);
}
.showup-live-dot{
  width:8px;
  height:8px;
  border-radius:50%;
  background:#f95f85;
  animation:showup-blink 1.1s infinite;
}
@keyframes showup-blink{
  0%,100%{opacity:1;transform:scale(1)}
  50%{opacity:.35;transform:scale(.88)}
}
.showup-cta{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:12px;
  width:100%;
  max-width:760px;
  margin:0 auto 14px;
}
.showup-cta.is-hidden{display:none}
.showup-checkin-actions{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
  width:100%;
  max-width:760px;
  margin:0 auto 14px;
}
.showup-checkin-btn,
.showup-done-btn{
  min-height:50px;
  border-radius:12px;
  font-size:14px;
  font-weight:700;
  cursor:pointer;
}
.showup-checkin-btn.is-complete,
.showup-done-btn.is-complete,
.showup-checkin-btn:disabled,
.showup-done-btn:disabled{
  border:1px solid rgba(249,95,133,0.24);
  background:rgba(255,255,255,0.72);
  color:#f95f85;
  box-shadow:none;
  cursor:default;
}
.showup-done-btn{
  color:#f95f85;
}
.showup-status-line{
  min-height:20px;
  width:100%;
  max-width:760px;
  margin:2px auto 14px;
  font-size:13px;
  color:#9a7088;
  text-align:left;
  line-height:1.45;
}
.showup-status-line.is-done{
  color:#f95f85;
  font-weight:700;
}
.showup-live-meta{
  width:100%;
  max-width:760px;
  margin:0 auto 16px;
  text-align:center;
  font-size:12px;
  color:#9a7088;
}
.showup-member-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(122px, 138px));
  justify-content:center;
  gap:10px;
  border:none;
  border-radius:0;
  overflow:visible;
  background:transparent;
  margin:6px auto 0;
  width:100%;
  max-width:760px;
  box-shadow:none;
}
.showup-member-grid .showup-empty{
  grid-column:1 / -1;
  width:100%;
  box-sizing:border-box;
}
.showup-member-card{
  min-height:132px;
  padding:10px;
  display:grid;
  grid-template-columns:1fr;
  justify-items:center;
  align-content:start;
  gap:6px;
  background:var(--bg, #fff);
  border:1px solid rgba(249,95,133,0.18);
  border-radius:14px;
  text-align:center;
}
.showup-member-dot{
  position:absolute;
  top:-1px;
  right:-1px;
  width:10px;
  height:10px;
  border-radius:50%;
  border:2px solid #fff;
}
.showup-member-dot.is-active{background:#2fb66d}
.showup-member-dot.is-done{background:#f95f85}
.showup-member-dot.is-idle{background:#c9b2be}
.showup-avatar{
  width:40px;
  height:40px;
  border-radius:50%;
  border:1px solid rgba(249,95,133,0.25);
  display:grid;
  place-items:center;
  font-family:'Syne',sans-serif;
  font-size:13px;
  font-weight:700;
  color:#f95f85;
  background:var(--bg, #fff);
  position:relative;
}
.showup-member-name{
  margin:0;
  font-family:'Syne',sans-serif;
  font-size:13px;
  font-weight:700;
  text-align:center;
  color:#4d3142;
  max-width:100%;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.showup-member-status{
  margin:2px 0 0;
  font-size:11px;
  text-align:center;
}
.showup-member-time{
  margin:2px 0 0;
  font-size:10px;
  color:#b29cab;
  text-align:center;
  line-height:1.2;
}
.showup-member-status.is-active{color:#2fb66d}
.showup-member-status.is-done{color:#f95f85}
.showup-member-status.is-idle{color:#9a7088}
.showup-bell-btn{
  min-height:32px;
  border-radius:10px;
  padding:0 9px;
  color:#f95f85;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:5px;
  cursor:pointer;
  background:transparent;
  border:1px solid rgba(249,95,133,0.28);
  font-size:11px;
  font-weight:800;
  font-family:'DM Sans',sans-serif;
  white-space:nowrap;
}
.showup-feed-view,
.showup-ranks-view{
  min-height:0;
  display:grid;
  gap:0;
  align-content:start;
  background:var(--bg, #fff);
  flex:1;
  width:100%;
  max-width:760px;
  margin:0 auto;
  padding-bottom:18px;
}
.showup-compose-card,
.showup-feed-card,
.showup-rank-row,
.showup-empty{
  padding:14px;
}
.showup-compose-card{
  padding:16px 0 16px;
  border:none;
  border-bottom:1px solid rgba(77,49,66,0.08);
  border-radius:0;
  background:transparent;
}
.showup-compose-top,
.showup-feed-header,
.showup-comment-row{
  display:flex;
  align-items:flex-start;
  gap:10px;
}
.showup-compose-input,
.showup-comment-input{min-height:44px}
.showup-compose-input{
  border:none;
  border-radius:0;
  padding:10px 0;
  background:transparent;
  font-size:15px;
}
.showup-sheet-textarea{
  min-height:96px;
  resize:vertical;
}
.showup-compose-actions,
.showup-feed-actions{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  margin-top:10px;
}
.showup-photo-btn,
.showup-post-btn,
.showup-comment-send,
.showup-sheet-send,
.showup-sheet-cancel{
  border-radius:12px;
  min-height:40px;
  padding:0 14px;
  font-size:13px;
  font-weight:700;
  cursor:pointer;
}
.showup-post-btn,
.showup-sheet-send{
  box-shadow:0 12px 28px rgba(249,95,133,0.18);
}
.showup-post-btn:disabled{
  cursor:not-allowed;
  opacity:.55;
  box-shadow:none;
}
.showup-feed-card.is-anonymous{border-style:dashed}
.showup-feed-card{
  border:none;
  border-top:1px solid rgba(77,49,66,0.08);
  border-radius:0;
  background:transparent;
  padding:18px 0;
}
.showup-feed-card.is-anonymous{
  border:1px dashed rgba(249,95,133,0.38);
  border-radius:12px;
  padding:14px 12px;
  margin-top:12px;
}
.showup-feed-author{
  display:flex;
  gap:10px;
  align-items:center;
}
.showup-feed-name{
  margin:0;
  font-family:'Syne',sans-serif;
  font-size:13px;
  font-weight:700;
  color:#4d3142;
}
.showup-feed-time{
  margin:2px 0 0;
  font-size:11px;
  color:#9a7088;
}
.showup-feed-text{
  margin:12px 0 0;
  font-size:14px;
  line-height:1.65;
  color:#4d3142;
  white-space:pre-wrap;
}
.showup-feed-image{
  width:100%;
  aspect-ratio:4 / 3;
  object-fit:cover;
  border-radius:12px;
  border:1px solid rgba(249,95,133,0.25);
  margin-top:12px;
}
.showup-feed-reactions{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  margin-top:14px;
}
.showup-feed-chip-row{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}
.showup-reaction-chip,
.showup-comment-toggle{
  min-height:38px;
  border-radius:999px;
  padding:0 12px;
  color:#9a7088;
  font-size:12px;
  font-weight:700;
  cursor:pointer;
}
.showup-reaction-chip.is-active{
  background:rgba(249,95,133,0.14);
  color:#f95f85;
}
.showup-comments{
  display:grid;
  gap:10px;
  margin-top:12px;
  padding-top:2px;
  max-height:320px;
  overflow-y:auto;
  overscroll-behavior:contain;
}
.showup-comment-bubble{
  padding:10px 12px;
  flex:1;
}
.showup-comment-author{
  margin:0 0 4px;
  font-family:'Syne',sans-serif;
  font-size:11px;
  font-weight:700;
  color:#4d3142;
}
.showup-comment-text{
  margin:0;
  font-size:12px;
  line-height:1.55;
  color:#4d3142;
  white-space:pre-wrap;
}
.showup-comment-actions{
  display:flex;
  align-items:center;
  gap:8px;
  margin-top:8px;
}
.showup-comment-action{
  border:none;
  background:transparent;
  color:#f95f85;
  font-size:11px;
  font-weight:800;
  font-family:'DM Sans',sans-serif;
  cursor:pointer;
  padding:0;
}
.showup-replies{
  display:grid;
  gap:8px;
  margin-top:9px;
  padding-left:12px;
  border-left:1px solid rgba(249,95,133,0.18);
}
.showup-reply-bubble{
  background:rgba(255,255,255,0.62);
  border:1px solid rgba(249,95,133,0.16);
  border-radius:12px;
  padding:8px 10px;
}
.showup-comment-compose{
  display:flex;
  gap:8px;
}
.showup-rank-row{
  display:grid;
  grid-template-columns:34px 42px minmax(0,1fr) auto auto;
  align-items:center;
  gap:10px;
  padding:15px 0;
  border-top:1px solid rgba(77,49,66,0.08);
}
.showup-rank-row:first-child{
  border-top:none;
}
.showup-rank-number{
  font-family:'Syne',sans-serif;
  font-size:14px;
  font-weight:700;
  color:#f95f85;
  text-align:center;
}
.showup-rank-number.is-leader{color:#c79a1d}
.showup-rank-number.is-rising{color:#91939f}
.showup-rank-number.is-building{color:#f95f85}
.showup-rank-number.is-muted{color:#b8a3ae}
.showup-rank-name{
  margin:0;
  font-family:'Syne',sans-serif;
  font-size:13px;
  font-weight:700;
  color:#4d3142;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.showup-rank-streak{
  margin:2px 0 0;
  font-size:11px;
  color:#9a7088;
}
.showup-rank-badge{
  border:1px solid rgba(249,95,133,0.25);
  border-radius:999px;
  padding:6px 10px;
  font-size:11px;
  font-weight:700;
  color:#9a7088;
  white-space:nowrap;
  justify-self:end;
}
.showup-rank-score{
  display:grid;
  gap:2px;
  justify-items:end;
  min-width:70px;
}
.showup-rank-score-value{
  font-family:'Syne',sans-serif;
  font-size:16px;
  font-weight:800;
  color:#4d3142;
  line-height:1;
}
.showup-rank-score-label{
  font-size:10px;
  color:#9a7088;
  line-height:1;
}
.showup-rank-row.is-leader .showup-rank-badge{border-color:rgba(231,186,73,.55);color:#b68500}
.showup-rank-row.is-rising .showup-rank-badge{border-color:rgba(189,189,195,.65);color:#7d7d89}
.showup-rank-row.is-building .showup-rank-badge{color:#f95f85}
.showup-tabs{
  position:fixed;
  left:50%;
  bottom:0;
  transform:translateX(-50%);
  width:100%;
  max-width:none;
  padding:10px 20px calc(24px + env(safe-area-inset-bottom, 0px));
  box-sizing:border-box;
  display:grid;
  grid-template-columns:repeat(3, 1fr);
  gap:8px;
  z-index:15;
  background:transparent;
  border-top:1px solid rgba(249,95,133,0.12);
  backdrop-filter:blur(14px);
}
.showup-tab{
  min-height:48px;
  border-radius:999px;
  border:1px solid rgba(249,95,133,0.35);
  background:transparent;
  color:#f95f85;
  font-size:13px;
  font-weight:800;
  cursor:pointer;
  box-shadow:none;
}
.showup-header-btn:focus-visible,
.showup-checkin-btn:focus-visible,
.showup-done-btn:focus-visible,
.showup-tab:focus-visible,
.showup-bell-btn:focus-visible,
.showup-photo-btn:focus-visible,
.showup-post-btn:focus-visible,
.showup-comment-send:focus-visible,
.showup-comment-toggle:focus-visible,
.showup-reaction-chip:focus-visible,
.showup-sheet-send:focus-visible,
.showup-sheet-cancel:focus-visible,
.showup-template-btn:focus-visible{
  outline:2px solid rgba(249,95,133,0.55);
  outline-offset:3px;
}
.showup-tab.is-active{
  background:linear-gradient(135deg,#f95f85,#ff8ca8);
  color:#fff;
  border-color:transparent;
  box-shadow:0 10px 24px rgba(249,95,133,0.22);
}
.showup-sheet-backdrop{
  position:fixed;
  inset:0;
  background:rgba(41,18,31,.25);
  display:flex;
  align-items:flex-end;
  justify-content:center;
  z-index:20;
}
.showup-sheet{
  width:100%;
  max-width:520px;
  background:#fff;
  border-radius:20px 20px 0 0;
  padding:18px 16px calc(26px + env(safe-area-inset-bottom, 0px));
  box-sizing:border-box;
  display:grid;
  gap:12px;
  box-shadow:0 -22px 48px rgba(77,49,66,0.14);
}
.showup-sheet-handle{
  width:42px;
  height:5px;
  border-radius:999px;
  background:rgba(77,49,66,0.18);
  margin:0 auto 4px;
}
.showup-sheet-subtitle{
  margin:0;
  font-size:12px;
  line-height:1.5;
  color:#9a7088;
}
.showup-sheet-title{
  margin:0;
  font-family:'Syne',sans-serif;
  font-size:20px;
  font-weight:700;
  color:#4d3142;
  display:flex;
  align-items:center;
  gap:8px;
}
.showup-sheet-list{
  display:grid;
  gap:0;
  border-top:1px solid rgba(77,49,66,0.08);
  border-bottom:1px solid rgba(77,49,66,0.08);
}
.showup-template-btn{
  width:100%;
  min-height:46px;
  border:none;
  border-radius:0;
  border-top:1px solid rgba(77,49,66,0.08);
  padding:12px 2px;
  text-align:left;
  color:#4d3142;
  font-size:13px;
  cursor:pointer;
  background:transparent;
}
.showup-template-btn:first-child{
  border-top:none;
}
.showup-template-btn.is-selected{
  background:rgba(249,95,133,0.08);
  color:#f95f85;
}
.showup-sheet-divider{
  display:flex;
  align-items:center;
  gap:10px;
  color:#9a7088;
  font-size:12px;
}
.showup-sheet-divider::before,
.showup-sheet-divider::after{
  content:'';
  flex:1;
  height:1px;
  background:rgba(249,95,133,0.18);
}
.showup-anon{
  display:flex;
  align-items:flex-start;
  gap:10px;
  font-size:12px;
  color:#9a7088;
}
.showup-anon input{accent-color:#f95f85}
.showup-sheet-actions{
  display:grid;
  gap:8px;
}
.showup-sheet-cancel{color:#9a7088}
.showup-hidden-input{display:none}
.showup-empty{
  text-align:center;
  color:#9a7088;
  font-size:13px;
  line-height:1.6;
  background:var(--bg, #fff);
  padding:22px 12px;
}
@media (max-width: 767px){
  .showup-root{
    min-height:100dvh;
  }
  .showup-shell{
    max-width:100%;
    padding:12px 12px 104px;
    min-height:100dvh;
  }
  .showup-list-header{
    padding:6px 2px 10px;
  }
  .showup-list-panel{
    border-radius:12px;
  }
  .showup-list-row{
    min-height:50px;
    padding:8px 10px;
    grid-template-columns:34px minmax(0,1fr) auto;
    gap:8px;
  }
  .showup-list-icon{
    width:30px;
    height:30px;
    border-radius:8px;
  }
  .showup-list-name{
    font-size:13px;
  }
  .showup-list-meta{
    font-size:10px;
  }
  .showup-join-pill{
    min-height:28px;
    padding:4px 10px;
    font-size:11px;
  }
  .showup-topbar{
    grid-template-columns:42px minmax(0,1fr) auto;
    gap:8px;
  }
  .showup-room-title{
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
  }
  .showup-live-pill{
    padding:9px 10px;
    font-size:11px;
  }
  .showup-checkin-actions{
    grid-template-columns:1fr;
    gap:8px;
  }
  .showup-feed-reactions{
    align-items:flex-start;
    flex-direction:column;
  }
  .showup-member-grid{
    grid-template-columns:repeat(2, minmax(118px, 1fr));
    gap:8px;
  }
  .showup-member-card{
    min-height:128px;
    padding:9px 6px;
    border-radius:12px;
  }
  .showup-bell-btn{
    min-height:28px;
    padding:0 8px;
    font-size:10px;
  }
  .showup-bell-btn span{
    max-width:86px;
    overflow:hidden;
    text-overflow:ellipsis;
  }
  .showup-comment-compose{
    flex-direction:column;
  }
  .showup-comment-send{
    width:100%;
  }
  .showup-rank-row{
    grid-template-columns:28px 40px minmax(0,1fr) auto;
    gap:8px;
  }
  .showup-rank-badge{
    display:none;
  }
  .showup-rank-score{
    min-width:48px;
  }
}
@media (min-width: 768px){
  .showup-shell{
    padding:24px 32px 148px;
  }
  .showup-sticky-header{
    top:0;
  }
  .showup-tabs{
    max-width:420px;
    left:50%;
    bottom:20px;
    transform:translateX(-50%);
    padding:8px;
    border:1px solid rgba(249,95,133,0.18);
    border-radius:999px;
    background:rgba(255,255,255,0.88);
    box-shadow:0 18px 42px rgba(77,49,66,0.12);
    display:grid;
    grid-template-columns:repeat(3, 1fr);
    gap:6px;
    backdrop-filter:blur(16px);
  }
  .showup-tab{
    min-height:42px;
    padding:0 16px;
    border:1px solid transparent;
    border-radius:999px;
    background:transparent;
    color:#a27a8c;
    box-shadow:none;
  }
  .showup-tab.is-active{
    background:linear-gradient(135deg,#f95f85,#ff8ca8);
    color:#fff;
    border-color:transparent;
    box-shadow:0 10px 24px rgba(249,95,133,0.2);
  }
  .showup-member-grid{
    margin-top:auto;
    padding-top:18px;
  }
}
@media (min-width: 1180px){
  .showup-shell{
    max-width:1180px;
  }
  .showup-live-layout{
    display:grid;
    grid-template-columns:minmax(0,760px) minmax(280px,1fr);
    align-items:start;
    gap:24px;
    width:100%;
  }
}
@media (hover: hover){
  .showup-header-btn:hover,
  .showup-bell-btn:hover,
  .showup-photo-btn:hover,
  .showup-comment-toggle:hover,
  .showup-reaction-chip:hover,
  .showup-template-btn:hover{
    border-color:rgba(249,95,133,0.4);
    background:rgba(249,95,133,0.08);
  }
  .showup-member-card:hover{
    background:rgba(255,255,255,0.9);
  }
  .showup-checkin-btn:hover,
  .showup-post-btn:hover,
  .showup-sheet-send:hover{
    transform:translateY(-1px);
    box-shadow:0 14px 28px rgba(249,95,133,0.22);
  }
}
`

const ROOM_DEFINITIONS = [
  { id: 'health-fitness', name: 'Health & Fitness', description: 'Body, food, sleep, gym, energy', roomColor: '#f25e92' },
  { id: 'career-business', name: 'Career & Business', description: 'Job, entrepreneurship, income streams', roomColor: '#7a58b0' },
  { id: 'wealth', name: 'Wealth', description: 'Savings, investing, debt, financial freedom', roomColor: '#d4773a' },
  { id: 'relationships', name: 'Relationships', description: 'Love, family, friendships, community', roomColor: '#e07b9f' },
  { id: 'inner-life', name: 'Inner Life', description: 'Spirituality, religion, mindfulness, mental health', roomColor: '#4a7fc1' },
  { id: 'personal-growth', name: 'Personal Growth', description: 'Learning, creativity, self-development', roomColor: '#5e8f64' },
]

const ROOM_ICONS = {
  'health-fitness': Dumbbell,
  'career-business': BriefcaseBusiness,
  wealth: HandCoins,
  relationships: HeartHandshake,
  'inner-life': Sparkles,
  'personal-growth': Sprout,
}

const TEMPLATE_MESSAGES = [
  'We are waiting on you \u{1F440}',
  'Hey I haven\u2019t seen you in a while. Hope you\u2019re good \u{1F90D}',
  'Girl I thought you were doing your tasks \u{1F602}',
  'You coming? I\u2019ll cover for you \u{1F4AA}',
  'How are you today? \u{1F338}',
]

const REACTION_KEYS = [
  { key: 'fire', label: 'Fire' },
  { key: 'power', label: 'Power' },
  { key: 'love', label: 'Love' },
]

const MAX_ROOM_SIZE = 12

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function safeWrite(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function getTodayKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTimestamp(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function normalize(value) {
  return String(value || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function buildInitials(name) {
  const words = String(name || 'User').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return 'U'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase()
}

function getActiveBoard() {
  const direct = localStorage.getItem('phasr_vb')
  if (direct) {
    try { return JSON.parse(direct) } catch {}
  }
  const activeUser = localStorage.getItem('phasr_active_user') || ''
  if (activeUser) {
    try {
      const scoped = localStorage.getItem(`phasr_vb:${activeUser}`)
      if (scoped) return JSON.parse(scoped)
    } catch {}
  }
  return null
}

function detectSuggestedRoom() {
  const board = getActiveBoard()
  const phases = Array.isArray(board?.phases) ? board.phases : []
  const phase =
    phases.find(item => item?.id === board?.activePhaseId) ||
    phases[board?.activePhaseIndex || 0] ||
    phases[0] ||
    null
  const pillarText = normalize(phase?.pillars?.[0]?.name || '')
  const matched = ROOM_DEFINITIONS.find(room => pillarText.includes(normalize(room.name)))
  return matched?.name || ROOM_DEFINITIONS[0].name
}

function detectRoomNameFromBoard() {
  return detectSuggestedRoom()
}

function getCurrentStreakCount() {
  const raw = safeRead('phasr_streak', {})
  const next = Number(raw?.current || 0)
  return Number.isFinite(next) ? next : 0
}

function setLastCompletedToday() {
  const current = safeRead('phasr_streak', {})
  safeWrite('phasr_streak', {
    ...current,
    lastCompleted: getTodayKey(),
  })
}

function getFeedStorageKey(roomName) {
  return `phasr_showup_feed_${normalize(roomName)}`
}

function getRoomId(roomName) {
  return normalize(roomName)
}

function getMockMemberStorageKey(roomName) {
  return `phasr_showup_mock_members_${normalize(roomName)}`
}

function getCreatedRoomsKey() {
  return 'phasr_showup_created_rooms'
}

function getProfile(user, authUser) {
  const displayName =
    authUser?.user_metadata?.full_name ||
    authUser?.email?.split('@')[0] ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User'
  return {
    id: authUser?.id || user?.id || localStorage.getItem('phasr_active_user') || 'local-user',
    name: displayName,
    initials: buildInitials(displayName),
  }
}

function buildMockMember(profile, roomName) {
  return {
    room_name: roomName,
    user_id: profile.id,
    display_name: profile.name,
    initials: profile.initials,
    checked_in: false,
    task_done: false,
    check_in_time: '',
    streak_count: getCurrentStreakCount(),
  }
}

function getMemberStatus(member) {
  if (member?.task_done) return 'done'
  if (member?.checked_in) return 'active'
  return 'idle'
}

export default function ShowUp({ user, onGoToDailyStreaks }) {
  const [lockInState] = useState(() => loadLockInState())
  const [profile, setProfile] = useState({ id: 'local-user', name: 'User', initials: 'U' })
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [activeTab, setActiveTab] = useState('live')
  const [members, setMembers] = useState([])
  const [roomCounts, setRoomCounts] = useState({})
  const [checkedIn, setCheckedIn] = useState(false)
  const [taskDone, setTaskDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedPosts, setFeedPosts] = useState([])
  const [feedReady, setFeedReady] = useState(true)
  const [postDraft, setPostDraft] = useState('')
  const [postImage, setPostImage] = useState('')
  const [expandedComments, setExpandedComments] = useState({})
  const [commentDrafts, setCommentDrafts] = useState({})
  const [expandedReplies, setExpandedReplies] = useState({})
  const [replyDrafts, setReplyDrafts] = useState({})
  const [sheetState, setSheetState] = useState({ open: false, member: null })
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [notifyText, setNotifyText] = useState('')
  const [notifyAnonymous, setNotifyAnonymous] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showGate, setShowGate] = useState(false)
  const [createRoomName, setCreateRoomName] = useState('')
  const [createFocusAreaId, setCreateFocusAreaId] = useState(ROOM_DEFINITIONS[0].id)
  const fileInputRef = useRef(null)

  const summary = useMemo(() => getLockInSummary(lockInState), [lockInState])
  const daysStreak = Math.max(0, Number(summary.currentStreak || 0))
  const customRooms = useMemo(() => safeRead(getCreatedRoomsKey(), []), [showCreateForm, selectedRoom])
  const rooms = useMemo(() => {
    const mappedCustom = Array.isArray(customRooms)
      ? customRooms.map(room => ({
        id: room.id,
        name: room.name,
        description: room.description || 'Custom accountability room',
        roomColor: room.roomColor || '#f95f85',
      }))
      : []
    return [...mappedCustom, ...ROOM_DEFINITIONS]
  }, [customRooms])
  const preferredRoomName = useMemo(() => detectRoomNameFromBoard(), [])
  const joinedRoomNames = useMemo(() => {
    const joined = new Set()
    if (preferredRoomName) joined.add(preferredRoomName)
    rooms.forEach(room => {
      const stored = safeRead(getMockMemberStorageKey(room.name), [])
      if (Array.isArray(stored) && stored.some(member => member?.user_id === profile.id)) {
        joined.add(room.name)
      }
    })
    return joined
  }, [preferredRoomName, profile.id, rooms])

  useEffect(() => {
    if (!selectedRoom) return
    loadFeedPosts(selectedRoom)
  }, [selectedRoom])

  useEffect(() => {
    if (!selectedRoom) return
    safeWrite(getFeedStorageKey(selectedRoom), feedPosts)
  }, [feedPosts, selectedRoom])

  useEffect(() => {
    let alive = true

    async function bootstrap() {
      setLoading(true)
      try {
        const authResult = supabase ? await supabase.auth.getUser() : { data: { user: null } }
        const nextProfile = getProfile(user, authResult?.data?.user)
        if (!alive) return
        setProfile(nextProfile)
        await loadRoomCounts(nextProfile)
        if (selectedRoom) await loadMembers(selectedRoom, nextProfile)
      } catch (nextError) {
        console.error('Show Up bootstrap failed', nextError)
        if (alive) {
          const fallbackProfile = getProfile(user, null)
          setProfile(fallbackProfile)
          loadRoomCountsFromLocal(fallbackProfile)
          if (selectedRoom) loadMembersFromLocal(selectedRoom, fallbackProfile)
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    bootstrap()
    return () => {
      alive = false
    }
  }, [selectedRoom, user])

  useEffect(() => {
    if (!supabase) return undefined

    const channel = supabase
      .channel('show-up-room-counts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'show_up_checkins',
      }, () => {
        loadRoomCounts(profile)
        if (selectedRoom) loadMembers(selectedRoom, profile)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile, selectedRoom])

  async function loadRoomCounts(nextProfile = profile) {
    const today = getTodayKey()
    if (!supabase) {
      loadRoomCountsFromLocal(nextProfile)
      return
    }

    try {
      const { data, error: countsError } = await supabase
        .from('show_up_checkins')
        .select('room_name')
        .gte('created_at', `${today}T00:00:00`)

      if (countsError) throw countsError

      const counts = {}
      ;(data || []).forEach(row => {
        counts[row.room_name] = (counts[row.room_name] || 0) + 1
      })
      setRoomCounts(counts)
    } catch (nextError) {
      console.error('Show Up room counts failed', nextError)
      loadRoomCountsFromLocal(nextProfile)
    }
  }

  function loadRoomCountsFromLocal(nextProfile = profile) {
    const counts = {}
    rooms.forEach(room => {
      const stored = safeRead(getMockMemberStorageKey(room.name), [])
      const nextMembers = Array.isArray(stored) && stored.length ? stored : [buildMockMember(nextProfile, room.name)]
      counts[room.name] = nextMembers.length
    })
    setRoomCounts(counts)
  }

  async function loadMembers(roomName, nextProfile = profile) {
    const today = getTodayKey()
    if (!supabase) {
      loadMembersFromLocal(roomName, nextProfile)
      return
    }

    try {
      const { data, error: membersError } = await supabase
        .from('show_up_checkins')
        .select('*')
        .eq('room_name', roomName)
        .gte('created_at', `${today}T00:00:00`)
        .order('check_in_time', { ascending: true })

      if (membersError) throw membersError

      const nextMembers = (data || []).map(member => ({
        ...member,
        streak_count: member?.user_id === nextProfile.id ? getCurrentStreakCount() : Number(member?.streak_count || 0),
      }))

      if (!nextMembers.some(member => member.user_id === nextProfile.id)) {
        nextMembers.unshift(buildMockMember(nextProfile, roomName))
      }

      setMembers(nextMembers)
      hydrateCurrentMember(nextMembers, nextProfile)
    } catch (nextError) {
      console.error('Show Up members failed', nextError)
      loadMembersFromLocal(roomName, nextProfile)
    }
  }

  function loadMembersFromLocal(roomName, nextProfile = profile) {
    const stored = safeRead(getMockMemberStorageKey(roomName), [])
    const nextMembers = Array.isArray(stored) && stored.length ? stored : [buildMockMember(nextProfile, roomName)]
    if (!nextMembers.some(member => member.user_id === nextProfile.id)) {
      nextMembers.unshift(buildMockMember(nextProfile, roomName))
    }
    const withStreaks = nextMembers.map(member => ({
      ...member,
      streak_count: member?.user_id === nextProfile.id ? getCurrentStreakCount() : Number(member?.streak_count || 0),
    }))
    safeWrite(getMockMemberStorageKey(roomName), withStreaks)
    setMembers(withStreaks)
    hydrateCurrentMember(withStreaks, nextProfile)
  }

  function hydrateCurrentMember(nextMembers, nextProfile = profile) {
    const myMember = nextMembers.find(member => member.user_id === nextProfile.id)
    const nextCheckedIn = Boolean(myMember?.checked_in)
    const nextTaskDone = Boolean(myMember?.task_done)
    setCheckedIn(nextCheckedIn)
    setTaskDone(nextTaskDone)
  }

  function upsertLocalMember(roomName, patch) {
    const current = safeRead(getMockMemberStorageKey(roomName), [])
    const next = [...current]
    const index = next.findIndex(member => member.user_id === patch.user_id)
    if (index >= 0) next[index] = { ...next[index], ...patch }
    else next.unshift({ ...buildMockMember(profile, roomName), ...patch })
    safeWrite(getMockMemberStorageKey(roomName), next)
    loadMembersFromLocal(roomName, profile)
    loadRoomCountsFromLocal(profile)
  }

  async function loadFeedPosts(roomName) {
    const localPosts = safeRead(getFeedStorageKey(roomName), [])
    if (!supabase) {
      setFeedReady(false)
      setFeedPosts(Array.isArray(localPosts) ? localPosts : [])
      return
    }

    try {
      const { data, error: feedError } = await supabase
        .from('room_feed')
        .select('room_id,user_id,display_name,content,image_url,is_anonymous,created_at')
        .eq('room_id', getRoomId(roomName))
        .order('created_at', { ascending: false })

      if (feedError) throw feedError

      const cachedPosts = Array.isArray(localPosts) ? localPosts : []
      const remotePosts = (data || []).map((post, index) => {
        const cached = cachedPosts.find(item => item.createdAt === post.created_at && item.text === (post.content || ''))
        return {
          id: `${post.user_id || 'room'}-${post.created_at || index}`,
          authorId: post.user_id || `anon-${index}`,
          authorName: post.is_anonymous ? 'Anonymous \u00B7 Room' : (post.display_name || 'Room member'),
          authorInitials: post.is_anonymous ? 'AN' : buildInitials(post.display_name || 'Room member'),
          anonymous: Boolean(post.is_anonymous),
          text: post.content || '',
          image: post.image_url || '',
          createdAt: post.created_at || new Date().toISOString(),
          reactions: cached?.reactions || { fire: [], power: [], love: [] },
          comments: (cached?.comments || []).map(comment => ({
            ...comment,
            reactions: comment.reactions || { love: [] },
            replies: comment.replies || [],
          })),
        }
      })

      setFeedReady(true)
      setFeedPosts(remotePosts)
    } catch (nextError) {
      console.error('Show Up feed load failed', nextError)
      setFeedReady(false)
      setFeedPosts(Array.isArray(localPosts) ? localPosts : [])
    }
  }

  async function createFeedPost({ text, image = '', anonymous = false, author = null }) {
    const createdAt = new Date().toISOString()
    const postAuthor = author || {
      id: anonymous ? `anon-${uid()}` : profile.id,
      name: anonymous ? 'Anonymous \u00B7 Room' : profile.name,
      initials: anonymous ? 'AN' : profile.initials,
    }
    const nextPost = {
      id: uid(),
      authorId: postAuthor.id,
      authorName: postAuthor.name,
      authorInitials: postAuthor.initials,
      anonymous,
      text,
      image,
      createdAt,
      reactions: { fire: [], power: [], love: [] },
      comments: [],
    }

    addFeedPost(nextPost)

    if (!supabase || !selectedRoom) return nextPost

    try {
      const { error: insertError } = await supabase
        .from('room_feed')
        .insert({
          room_id: getRoomId(selectedRoom),
          user_id: postAuthor.id === 'sage' ? profile.id : postAuthor.id,
          display_name: postAuthor.name,
          content: text,
          image_url: image || '',
          is_anonymous: anonymous,
          created_at: createdAt,
        })

      if (insertError) throw insertError
      setFeedReady(true)
    } catch (nextError) {
      console.error('Show Up feed post failed', nextError)
      setFeedReady(false)
    }

    return nextPost
  }

  function createRoomActivityPost(text) {
    return createFeedPost({
      text,
      image: '',
      anonymous: false,
      author: {
        id: profile.id,
        name: profile.name,
        initials: profile.initials,
      },
    })
  }

  async function ensureRoomMembership(roomName) {
    const payload = {
      room_name: roomName,
      user_id: profile.id,
      display_name: profile.name,
      initials: profile.initials,
      checked_in: false,
      task_done: false,
      streak_count: getCurrentStreakCount(),
    }

    try {
      if (!supabase) throw new Error(supabaseConfigError || 'Supabase unavailable')
      await supabase.from('show_up_checkins').upsert(payload, { onConflict: 'room_name,user_id' })
    } catch (nextError) {
      console.error('Show Up membership fallback', nextError)
      upsertLocalMember(roomName, payload)
    }
  }

  async function handleJoinRoom(roomName) {
    setLoading(true)
    await ensureRoomMembership(roomName)
    setSelectedRoom(roomName)
    setActiveTab('live')
    setLoading(false)
  }

  async function handleCheckIn() {
    if (!selectedRoom) return
    const nowIso = new Date().toISOString()
    const payload = {
      room_name: selectedRoom,
      user_id: profile.id,
      display_name: profile.name,
      initials: profile.initials,
      checked_in: true,
      task_done: false,
      check_in_time: nowIso,
      streak_count: getCurrentStreakCount(),
    }

    try {
      if (!supabase) throw new Error(supabaseConfigError || 'Supabase unavailable')
      await supabase.from('show_up_checkins').upsert(payload, { onConflict: 'room_name,user_id' })
    } catch (nextError) {
      console.error('Show Up check-in failed', nextError)
      upsertLocalMember(selectedRoom, payload)
    }

    setCheckedIn(true)
    setTaskDone(false)
    const checkedInText = `${profile.name} checked in at ${formatTime(nowIso)}.`
    await createRoomActivityPost(checkedInText)
    loadMembers(selectedRoom, profile)
  }

  async function handleMarkDone() {
    if (!selectedRoom) return
    const nowIso = new Date().toISOString()
    const currentMember = members.find(member => member.user_id === profile.id)
    const checkedInAt = currentMember?.check_in_time || nowIso

    try {
      if (!supabase) throw new Error(supabaseConfigError || 'Supabase unavailable')
      await supabase
        .from('show_up_checkins')
        .update({ checked_in: true, task_done: true, check_in_time: checkedInAt })
        .eq('room_name', selectedRoom)
        .eq('user_id', profile.id)
    } catch (nextError) {
      console.error('Show Up mark done failed', nextError)
      upsertLocalMember(selectedRoom, {
        room_name: selectedRoom,
        user_id: profile.id,
        display_name: profile.name,
        initials: profile.initials,
        checked_in: true,
        task_done: true,
        check_in_time: checkedInAt,
        streak_count: getCurrentStreakCount(),
      })
    }

    setLastCompletedToday()
    setCheckedIn(true)
    setTaskDone(true)
    const doneText = `${profile.name} marked done at ${formatTime(nowIso)}.`
    await createRoomActivityPost(doneText)
    loadMembers(selectedRoom, profile)
  }

  function handlePhotoPick(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPostImage(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  function addFeedPost(post) {
    setFeedPosts(current => [post, ...current].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  }

  async function handleCreatePost() {
    const text = postDraft.trim()
    if (!text && !postImage) return
    await createFeedPost({ text, image: postImage, anonymous: false })
    setPostDraft('')
    setPostImage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleToggleReaction(postId, reactionKey) {
    setFeedPosts(current => current.map(post => {
      if (post.id !== postId) return post
      const nextSet = new Set(post.reactions?.[reactionKey] || [])
      if (nextSet.has(profile.id)) nextSet.delete(profile.id)
      else nextSet.add(profile.id)
      return {
        ...post,
        reactions: {
          ...post.reactions,
          [reactionKey]: [...nextSet],
        },
      }
    }))
  }

  function handleAddComment(postId) {
    const draft = String(commentDrafts[postId] || '').trim()
    if (!draft) return
    setFeedPosts(current => current.map(post => {
      if (post.id !== postId) return post
      return {
        ...post,
        comments: [
          ...(post.comments || []),
          {
            id: uid(),
            authorId: profile.id,
            authorName: profile.name,
            authorInitials: profile.initials,
            anonymous: false,
            text: draft,
            createdAt: new Date().toISOString(),
            reactions: { love: [] },
            replies: [],
          },
        ],
      }
    }))
    setCommentDrafts(current => ({ ...current, [postId]: '' }))
  }

  function handleToggleCommentReaction(postId, commentId) {
    setFeedPosts(current => current.map(post => {
      if (post.id !== postId) return post
      return {
        ...post,
        comments: (post.comments || []).map(comment => {
          if (comment.id !== commentId) return comment
          const nextSet = new Set(comment.reactions?.love || [])
          if (nextSet.has(profile.id)) nextSet.delete(profile.id)
          else nextSet.add(profile.id)
          return {
            ...comment,
            reactions: {
              ...comment.reactions,
              love: [...nextSet],
            },
          }
        }),
      }
    }))
  }

  function handleAddReply(postId, commentId) {
    const draftKey = `${postId}:${commentId}`
    const draft = (replyDrafts[draftKey] || '').trim()
    if (!draft) return
    setFeedPosts(current => current.map(post => {
      if (post.id !== postId) return post
      return {
        ...post,
        comments: (post.comments || []).map(comment => {
          if (comment.id !== commentId) return comment
          return {
            ...comment,
            replies: [
              ...(comment.replies || []),
              {
                id: uid(),
                authorId: profile.id,
                authorName: profile.name,
                authorInitials: profile.initials,
                text: draft,
                createdAt: new Date().toISOString(),
              },
            ],
          }
        }),
      }
    }))
    setReplyDrafts(current => ({ ...current, [draftKey]: '' }))
  }

  function openNotifySheet(member) {
    setSheetState({ open: true, member })
    setSelectedTemplate('')
    setNotifyText('')
    setNotifyAnonymous(false)
  }

  function handleSelectTemplate(template) {
    setSelectedTemplate(template)
    setNotifyText(template)
  }

  async function handleSendNotification() {
    const text = notifyText.trim()
    if (!text || !sheetState.member) return
    await createFeedPost({ text, image: '', anonymous: notifyAnonymous })
    setSheetState({ open: false, member: null })
    setSelectedTemplate('')
    setNotifyText('')
    setNotifyAnonymous(false)
  }

  function handleCreateRoomPress() {
    const latestLevel = getStoredUserLevel() || calculateUserPoints()
    if ((latestLevel?.level || 1) < 4) {
      setShowGate(true)
      setShowCreateForm(false)
      return
    }
    setShowGate(false)
    setShowCreateForm(current => !current)
  }

  function handleCreateRoomSubmit(event) {
    event.preventDefault()
    const room = createRoomName.trim()
    if (!room) return
    const focus = rooms.find(item => item.id === createFocusAreaId) || ROOM_DEFINITIONS[0]
    const nextRooms = [
      ...safeRead(getCreatedRoomsKey(), []),
      {
        id: uid(),
        name: room,
        description: focus.description,
        roomColor: focus.roomColor,
      },
    ]
    safeWrite(getCreatedRoomsKey(), nextRooms)
    setCreateRoomName('')
    setCreateFocusAreaId(ROOM_DEFINITIONS[0].id)
    setShowCreateForm(false)
  }

  const completedCount = useMemo(() => members.filter(member => getMemberStatus(member) === 'done').length, [members])
  const activeCount = useMemo(() => members.filter(member => member.checked_in && !member.task_done).length, [members])
  const currentMember = useMemo(() => members.find(member => member.user_id === profile.id) || null, [members, profile.id])
  const liveMembers = useMemo(() => {
    if (!checkedIn && !taskDone) return []
    return members.filter(member => member.checked_in || member.task_done)
  }, [checkedIn, taskDone, members])
  const visiblePosts = useMemo(() => [...feedPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [feedPosts])
  const rankedMembers = useMemo(() => {
    return [...members]
      .map(member => ({
        ...member,
        streakValue: member.user_id === profile.id ? getCurrentStreakCount() : Number(member?.streak_count || 0),
      }))
      .sort((a, b) => b.streakValue - a.streakValue || String(a.display_name || '').localeCompare(String(b.display_name || '')))
  }, [members, profile.id])

  if (!selectedRoom) {
    return (
      <div
        className="showup-root"
        style={{
          background: 'linear-gradient(180deg,#fff8fb 0%,#fff2f7 100%)',
          color: '#4d3142',
        }}
      >
        <style>{SHOW_UP_STYLES}</style>
        <div
          className="showup-shell"
          style={{
            maxWidth: '100%',
            paddingTop: 18,
            paddingBottom: 24,
          }}
        >
          <div
            className="showup-list-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '8px 2px 18px',
            }}
          >
            <p
              className="showup-list-kicker"
              style={{
                margin: 0,
                fontSize: 12,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
                color: '#b98097',
                fontWeight: 700,
              }}
            >
              All Rooms
            </p>
            <button
              type="button"
              className="showup-create-link"
              onClick={handleCreateRoomPress}
              style={{
                border: 'none',
                background: 'transparent',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#f45f92',
                fontSize: 15,
                fontWeight: 800,
                fontFamily: "'DM Sans',sans-serif",
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <Plus size={16} strokeWidth={2.4} />
              <span>Create room</span>
            </button>
          </div>

          {showCreateForm ? (
            <form className="showup-create-form" onSubmit={handleCreateRoomSubmit}>
              <label className="showup-field">
                <span className="showup-field-label">Room Name</span>
                <input className="showup-input" value={createRoomName} onChange={event => setCreateRoomName(event.target.value)} placeholder="Enter room name" />
              </label>
              <label className="showup-field">
                <span className="showup-field-label">Focus Area</span>
                <select className="showup-select" value={createFocusAreaId} onChange={event => setCreateFocusAreaId(event.target.value)}>
                  {ROOM_DEFINITIONS.map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className="showup-create-btn">Create</button>
            </form>
          ) : null}

          {showGate ? (
            <div className="showup-gate-card">
              <p className="showup-gate-title">Keep going. Creating rooms unlocks at 90 days.</p>
              <p className="showup-gate-copy">
                You are {daysStreak} days in. The rooms you can join right now are where your people already are.
              </p>
              <div className="showup-gate-actions">
                <button type="button" className="showup-gate-btn" onClick={() => onGoToDailyStreaks?.()}>Go to Daily Streaks</button>
                <button type="button" className="showup-gate-btn" onClick={() => setShowGate(false)}>Close</button>
              </div>
            </div>
          ) : null}

          <div
            className="showup-list-panel"
            style={{
              border: '1px solid rgba(242,196,208,0.95)',
              borderRadius: 16,
              overflow: 'hidden',
              background: '#fff',
              boxShadow: 'none',
            }}
          >
            {rooms.map((room, index) => {
              const joined = roomCounts[room.name] || 0
              const spotsLeft = Math.max(0, MAX_ROOM_SIZE - joined)
              const isJoined = joinedRoomNames.has(room.name)
              const RoomIcon = ROOM_ICONS[room.id] || Sparkles
              return (
                <div
                  key={room.id}
                  className="showup-list-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px minmax(0,1fr) auto',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    minHeight: 60,
                    borderTop: index === 0 ? 'none' : '1px solid rgba(77,49,66,0.08)',
                  }}
                >
                  <div
                    className="showup-list-icon"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      display: 'grid',
                      placeItems: 'center',
                      background: `${room.roomColor}18`,
                      color: room.roomColor,
                      border: '1px solid rgba(249,95,133,0.08)',
                      boxShadow: 'none',
                    }}
                  >
                    <RoomIcon size={18} strokeWidth={2.1} />
                  </div>
                  <div className="showup-list-content" style={{ minWidth: 0, display: 'grid', gap: 2 }}>
                    <p className="showup-list-name" style={{ margin: 0, fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, color: '#25151f', lineHeight: 1.12 }}>{room.name}</p>
                    <p className="showup-list-meta" style={{ margin: 0, fontSize: 11, color: '#b29cab' }}>
                      {isJoined ? `${joined} members` : `${spotsLeft} spots`}
                    </p>
                  </div>
                  <div className="showup-list-action" style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      onClick={() => handleJoinRoom(room.name)}
                      className={`showup-join-pill ${isJoined ? 'is-joined' : ''}`}
                      style={{
                        minHeight: 30,
                        borderRadius: 999,
                        minWidth: 'auto',
                        padding: isJoined ? '5px 0' : '5px 14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                        border: isJoined ? '1px solid rgba(233,224,229,0.95)' : 'none',
                        background: isJoined ? '#fff' : 'linear-gradient(135deg,#ffd9e6,#ffeaf1)',
                        color: isJoined ? '#9a7088' : '#f45f92',
                        fontFamily: "'DM Sans',sans-serif",
                        cursor: 'pointer',
                      }}
                    >
                      {isJoined ? (
                        <span className="showup-list-state" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Check size={14} strokeWidth={2.5} color="#b5adb2" />
                          <span>Joined</span>
                        </span>
                      ) : (
                        <span>Join</span>
                      )}
                    </button>
                    <ChevronRight size={16} strokeWidth={2.3} color="#c89aab" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="showup-root" style={{ '--bg': '#fff8f9', background: '#fff8f9' }}>
      <style>{SHOW_UP_STYLES}</style>

      <div className="showup-shell" style={{ '--bg': '#fff8f9', background: '#fff8f9' }}>
        <div className="showup-sticky-header">
          <div className="showup-topbar">
            <button type="button" className="showup-header-btn" onClick={() => setSelectedRoom(null)}>{'\u2190'}</button>
            <h1 className="showup-room-title">{selectedRoom}</h1>
            <div className="showup-live-pill">
              <span className="showup-live-dot" />
              <span>{activeCount} active</span>
            </div>
          </div>

          {activeTab === 'live' ? (
            <div className="showup-checkin-actions">
              <button
                type="button"
                className={`showup-checkin-btn ${checkedIn ? 'is-complete' : ''}`}
                onClick={handleCheckIn}
                disabled={checkedIn}
              >
                {checkedIn
                  ? `Checked in${currentMember?.check_in_time ? ` ${formatTime(currentMember.check_in_time)}` : ''}`
                  : 'Check In'}
              </button>
              <button
                type="button"
                className={`showup-done-btn ${taskDone ? 'is-complete' : ''}`}
                onClick={handleMarkDone}
                disabled={!checkedIn || taskDone}
              >
                {taskDone ? 'Done today' : 'Mark Done'}
              </button>
            </div>
          ) : null}
          {activeTab === 'live' ? <p className="showup-live-meta">{members.length} in room {'\u00B7'} {completedCount} done today</p> : null}
        </div>

        <div className="showup-tabs">
          {[
            { key: 'live', label: 'Live' },
            { key: 'feed', label: 'Feed' },
            { key: 'ranks', label: 'Ranks' },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              className={`showup-tab ${activeTab === tab.key ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error ? <div className="showup-empty">{error}</div> : null}
        {loading && !members.length ? <div className="showup-empty">Loading your room...</div> : null}

        {activeTab === 'live' ? (
          <div className="showup-member-grid">
            {liveMembers.length === 0 ? (
              <div className="showup-empty">Check in to enter the live room.</div>
            ) : null}
            {liveMembers.map(member => {
              const status = getMemberStatus(member)
              const isSelf = member.user_id === profile.id
              return (
                <div key={member.user_id} className="showup-member-card">
                  <div className="showup-avatar">
                    {member.initials || buildInitials(member.display_name)}
                    <span className={`showup-member-dot ${status === 'active' ? 'is-active' : status === 'done' ? 'is-done' : 'is-idle'}`} />
                  </div>
                  <div style={{ minWidth: 0, maxWidth: '100%' }}>
                    <p className="showup-member-name">{isSelf ? 'You' : member.display_name}</p>
                    <p className={`showup-member-status ${status === 'active' ? 'is-active' : status === 'done' ? 'is-done' : 'is-idle'}`}>
                      {status === 'active' ? 'Checked in' : status === 'done' ? 'Done' : 'Not yet'}
                    </p>
                    {member.check_in_time ? <p className="showup-member-time">{formatTime(member.check_in_time)}</p> : null}
                  </div>
                  {!isSelf ? (
                    <button type="button" className="showup-bell-btn" onClick={() => openNotifySheet(member)}>
                      <MessageCircle size={14} strokeWidth={2.2} />
                      <span>Nudge this person</span>
                    </button>
                  ) : (
                    <div style={{ minHeight: 30 }} aria-hidden="true" />
                  )}
                </div>
              )
            })}
          </div>
        ) : null}

        {activeTab === 'feed' ? (
          <div className="showup-feed-view">
            <div className="showup-compose-card">
              <div className="showup-compose-top">
                <div className="showup-avatar">{profile.initials}</div>
                <input
                  className="showup-compose-input"
                  value={postDraft}
                  onChange={event => setPostDraft(event.target.value)}
                  placeholder="Share what you are working on..."
                />
              </div>
              {postImage ? <img className="showup-feed-image" src={postImage} alt="Upload preview" loading="lazy" /> : null}
              <div className="showup-compose-actions">
                <button type="button" className="showup-photo-btn" onClick={() => fileInputRef.current?.click()}>Photo</button>
                <button type="button" className="showup-post-btn" onClick={handleCreatePost} disabled={!postDraft.trim() && !postImage}>Post</button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="showup-hidden-input" onChange={handlePhotoPick} />
            </div>

            {!feedReady ? (
              <div className="showup-empty">You are seeing saved room activity. New posts will sync when the connection returns.</div>
            ) : null}

            {visiblePosts.length === 0 ? (
              <div className="showup-empty">No posts yet. Be the first to share.</div>
            ) : (
              visiblePosts.map(post => (
                <div key={post.id} className={`showup-feed-card ${post.anonymous ? 'is-anonymous' : ''}`}>
                  <div className="showup-feed-header">
                    <div className="showup-feed-author">
                      <div className="showup-avatar">{post.anonymous ? '\u{1F464}' : post.authorInitials || buildInitials(post.authorName)}</div>
                      <div>
                        <p className="showup-feed-name">{post.anonymous ? 'Anonymous \u00B7 Room' : post.authorName}</p>
                        <p className="showup-feed-time">{formatTimestamp(post.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  <p className="showup-feed-text">{post.text}</p>
                  {post.image ? <img className="showup-feed-image" src={post.image} alt="Feed upload" loading="lazy" /> : null}
                  <div className="showup-feed-reactions">
                    <div className="showup-feed-chip-row">
                      {REACTION_KEYS.map(reaction => {
                        const count = (post.reactions?.[reaction.key] || []).length
                        const active = (post.reactions?.[reaction.key] || []).includes(profile.id)
                        return (
                          <button
                            key={reaction.key}
                            type="button"
                            className={`showup-reaction-chip ${active ? 'is-active' : ''}`}
                            onClick={() => handleToggleReaction(post.id, reaction.key)}
                          >
                            {reaction.label} {count}
                          </button>
                        )
                      })}
                    </div>
                    <button
                      type="button"
                      className="showup-comment-toggle"
                      onClick={() => setExpandedComments(current => ({ ...current, [post.id]: !current[post.id] }))}
                    >
                      Comment
                    </button>
                  </div>
                  {expandedComments[post.id] ? (
                    <div className="showup-comments">
                      {(post.comments || []).map(comment => (
                        <div key={comment.id} className="showup-comment-row">
                          <div className="showup-avatar">{comment.anonymous ? 'AN' : comment.authorInitials || buildInitials(comment.authorName)}</div>
                          <div className="showup-comment-bubble">
                            <p className="showup-comment-author">{comment.anonymous ? 'Anonymous \u00B7 Room' : comment.authorName}</p>
                            <p className="showup-comment-text">{comment.text}</p>
                            <div className="showup-comment-actions">
                              <button
                                type="button"
                                className="showup-comment-action"
                                onClick={() => handleToggleCommentReaction(post.id, comment.id)}
                              >
                                Love {(comment.reactions?.love || []).length}
                              </button>
                              <button
                                type="button"
                                className="showup-comment-action"
                                onClick={() => setExpandedReplies(current => ({ ...current, [comment.id]: !current[comment.id] }))}
                              >
                                Reply {(comment.replies || []).length}
                              </button>
                            </div>
                            {expandedReplies[comment.id] ? (
                              <div className="showup-replies">
                                {(comment.replies || []).map(reply => (
                                  <div key={reply.id} className="showup-reply-bubble">
                                    <p className="showup-comment-author">{reply.authorName}</p>
                                    <p className="showup-comment-text">{reply.text}</p>
                                  </div>
                                ))}
                                <div className="showup-comment-compose">
                                  <input
                                    className="showup-comment-input"
                                    value={replyDrafts[`${post.id}:${comment.id}`] || ''}
                                    onChange={event => setReplyDrafts(current => ({ ...current, [`${post.id}:${comment.id}`]: event.target.value }))}
                                    placeholder="Reply..."
                                  />
                                  <button type="button" className="showup-comment-send" onClick={() => handleAddReply(post.id, comment.id)}>Send</button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                      <div className="showup-comment-compose">
                        <input
                          className="showup-comment-input"
                          value={commentDrafts[post.id] || ''}
                          onChange={event => setCommentDrafts(current => ({ ...current, [post.id]: event.target.value }))}
                          placeholder="Add a comment..."
                        />
                        <button type="button" className="showup-comment-send" onClick={() => handleAddComment(post.id)}>Send</button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        ) : null}

        {activeTab === 'ranks' ? (
          <div className="showup-ranks-view">
            {rankedMembers.map((member, index) => {
              const badge =
                index === 0 ? 'Leader'
                  : index === 1 ? 'Rising'
                    : index === 2 ? 'Building'
                      : member.streakValue > 0 ? 'Starting' : 'Not yet'
              const rowClass =
                index === 0 ? 'is-leader'
                  : index === 1 ? 'is-rising'
                    : index === 2 ? 'is-building'
                      : ''
              const rankClass =
                index === 0 ? 'is-leader'
                  : index === 1 ? 'is-rising'
                    : index === 2 ? 'is-building'
                      : 'is-muted'
              return (
                <div key={member.user_id} className={`showup-rank-row ${rowClass}`}>
                  <div className={`showup-rank-number ${rankClass}`}>{index + 1}</div>
                  <div className="showup-avatar">{member.initials || buildInitials(member.display_name)}</div>
                  <div>
                    <p className="showup-rank-name">{member.user_id === profile.id ? 'You' : member.display_name}</p>
                    <p className="showup-rank-streak">
                      {member.streakValue} day streak{member.task_done ? ' · Done today' : member.checked_in ? ` · Checked in ${formatTime(member.check_in_time)}` : ''}
                    </p>
                  </div>
                  <div className="showup-rank-score" aria-label={`${member.streakValue} day streak`}>
                    <span className="showup-rank-score-value">{member.streakValue}</span>
                    <span className="showup-rank-score-label">days</span>
                  </div>
                  <div className="showup-rank-badge">{badge}</div>
                </div>
              )
            })}
          </div>
        ) : null}
      </div>

      {sheetState.open && sheetState.member ? (
        <div className="showup-sheet-backdrop" onClick={() => setSheetState({ open: false, member: null })}>
          <div className="showup-sheet" onClick={event => event.stopPropagation()}>
            <div className="showup-sheet-handle" />
            <h2 className="showup-sheet-title">
              <MessageCircle size={18} strokeWidth={2.3} />
              <span>Nudge {sheetState.member.display_name}</span>
            </h2>
            <p className="showup-sheet-subtitle">They will receive this anonymously if you toggle it on.</p>
            <div className="showup-sheet-list">
              {TEMPLATE_MESSAGES.map(template => (
                <button
                  key={template}
                  type="button"
                  className={`showup-template-btn ${selectedTemplate === template ? 'is-selected' : ''}`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  {template}
                </button>
              ))}
            </div>
            <div className="showup-sheet-divider">or write your own</div>
            <textarea
              className="showup-sheet-textarea"
              value={notifyText}
              onChange={event => setNotifyText(event.target.value)}
              placeholder="Write your message..."
            />
            <label className="showup-anon">
              <input type="checkbox" checked={notifyAnonymous} onChange={event => setNotifyAnonymous(event.target.checked)} />
              <span>Send anonymously {'\u2014'} your name won{'\u2019'}t show in the feed.</span>
            </label>
            <div className="showup-sheet-actions">
              <button type="button" className="showup-sheet-send" onClick={handleSendNotification}>Send</button>
              <button type="button" className="showup-sheet-cancel" onClick={() => setSheetState({ open: false, member: null })}>Cancel</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
