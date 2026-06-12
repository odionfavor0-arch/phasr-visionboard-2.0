import { useEffect, useMemo, useRef, useState } from 'react'
import { BriefcaseBusiness, Check, ChevronRight, Dumbbell, HandCoins, Heart, HeartHandshake, Image as ImageIcon, LogOut, MessageCircle, Reply, Send, Sparkles, Sprout, ThumbsUp, Trash2 } from 'lucide-react'
import { supabase, supabaseConfigError } from '../lib/supabaseClient'

const SHOW_UP_STYLES = `
.showup-root{
  width:100%;
  min-height:auto;
  background:var(--bg, #fff8f9);
  color:#4d3142;
  font-family:'DM Sans',sans-serif;
  -webkit-tap-highlight-color:transparent;
  touch-action:manipulation;
  display:flex;
  flex-direction:column;
  overflow-x:hidden;
}
.showup-shell{
  width:100%;
  max-width:none;
  margin:0 auto;
  padding:18px 16px 32px;
  box-sizing:border-box;
  flex:0 0 auto;
  display:flex;
  flex-direction:column;
  min-height:0;
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
.showup-room-inline-banner{
  margin-bottom:10px;
  border-radius:12px;
  padding:12px 16px;
  background:rgba(249,95,133,0.08);
  color:#f95f85;
  font-size:13px;
  font-weight:800;
  line-height:1.35;
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
.showup-mini-link{
  border:none;
  background:transparent;
  color:#f95f85;
  font:inherit;
  font-size:12px;
  font-weight:800;
  cursor:pointer;
  padding:4px 0;
  white-space:nowrap;
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
  grid-template-columns:44px minmax(0,1fr);
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
  text-align:left;
  font-family:'Syne',sans-serif;
  font-size:16px;
  font-weight:700;
  color:#4d3142;
}
.showup-room-title-block{
  min-width:0;
  display:grid;
  gap:4px;
}
.showup-room-checkin-time{
  margin:0;
  color:#b98097;
  font-size:12px;
  font-weight:700;
  line-height:1.2;
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
.showup-room-subtitle{
  display:none;
}
.showup-room-streak{
  display:none;
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
.showup-checkin-btn:disabled{
  border:none;
  background:linear-gradient(135deg,#f95f85,#ff8ca8);
  color:#fff;
  opacity:.86;
  box-shadow:none;
  cursor:default;
}
.showup-done-btn.is-complete,
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
.showup-entry-status{
  width:100%;
  box-sizing:border-box;
  max-width:760px;
  margin:0;
  padding:9px 14px;
  border-radius:999px;
  background:rgba(249,95,133,0.1);
  color:#4d3142;
  font-size:13px;
  font-weight:800;
  line-height:1.2;
  text-align:center;
}
.showup-status-actions{
  width:100%;
  max-width:760px;
  margin:0 auto 14px;
  display:grid;
  grid-template-columns:1fr 1fr;
  align-items:stretch;
  gap:8px;
}
.showup-mini-done-btn{
  min-height:34px;
  border-radius:999px;
  border:1px solid rgba(249,95,133,0.24);
  background:rgba(255,255,255,0.72);
  color:#f95f85;
  padding:0 14px;
  font-size:12px;
  font-weight:800;
  font-family:'DM Sans',sans-serif;
  cursor:pointer;
  width:100%;
}
.showup-mini-done-btn.is-complete,
.showup-mini-done-btn:disabled{
  cursor:default;
  color:#9a7088;
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
  grid-template-columns:repeat(2, 1fr);
  justify-content:stretch;
  gap:12px;
  border:none;
  border-radius:0;
  overflow:visible;
  background:transparent;
  margin:6px auto 0;
  width:100%;
  max-width:860px;
  box-shadow:none;
}
.showup-member-grid .showup-empty{
  grid-column:1 / -1;
  width:100%;
  box-sizing:border-box;
}
.showup-member-card{
  width:100%;
  min-height:124px;
  padding:20px;
  display:grid;
  grid-template-columns:1fr;
  justify-items:center;
  align-content:center;
  gap:8px;
  background:#fff;
  border:1px solid rgba(249,95,133,0.14);
  border-radius:16px;
  text-align:center;
  cursor:pointer;
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
.showup-member-dot.is-inactive{background:#c9b2be}
.showup-member-dot.is-done{background:#f95f85}
.showup-member-dot.is-idle{background:#c9b2be}
.showup-avatar{
  width:48px;
  height:48px;
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
.showup-member-checkin-time{
  margin:5px 0 0;
  color:#b98097;
  font-size:12px;
  font-weight:700;
  line-height:1.2;
}
.showup-role-badge{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  margin-top:0;
  padding:4px 7px;
  border-radius:999px;
  color:#b98097;
  background:rgba(249,95,133,0.08);
  border:1px solid rgba(249,95,133,0.18);
  font-size:10px;
  font-weight:900;
  line-height:1;
  white-space:nowrap;
}
.showup-role-badge.is-leader{
  color:#9a6500;
  background:linear-gradient(135deg,#fff7d6,#ffe8a3);
  border-color:rgba(210,153,30,0.28);
}
.showup-member-status.is-active{color:#2fb66d}
.showup-member-status.is-done{color:#f95f85}
.showup-member-status.is-idle{color:#9a7088}
.showup-bell-btn{
  min-height:32px;
  width:100%;
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
  gap:10px;
  align-content:start;
  background:#fff;
  flex:1;
  width:100%;
  min-width:0;
  max-width:none;
  margin:0 auto;
  padding-bottom:18px;
  overflow-x:hidden;
}
.showup-feed-view{
  gap:12px;
}
.showup-sync-notice{
  border:1px solid rgba(249,95,133,0.16);
  border-radius:999px;
  background:rgba(249,95,133,0.06);
  color:#b98097;
  font-size:12px;
  font-weight:700;
  line-height:1.35;
  padding:8px 12px;
}
.showup-compose-card,
.showup-feed-card,
.showup-rank-row,
.showup-empty{
  padding:14px;
}
.showup-compose-card{
  padding:14px;
  border:1px solid rgba(249,95,133,0.18);
  border-radius:14px;
  background:rgba(255,255,255,0.72);
  width:100%;
  max-width:100%;
  min-width:0;
  box-sizing:border-box;
  overflow:hidden;
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
  flex:1 1 auto;
  min-width:0;
  width:100%;
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
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:7px;
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
  border:1px solid rgba(77,49,66,0.08);
  border-radius:12px;
  background:#fff;
  padding:14px;
  position:relative;
  box-shadow:0 1px 4px rgba(0,0,0,0.06);
  width:100%;
  max-width:100%;
  min-width:0;
  box-sizing:border-box;
  overflow:hidden;
}
.showup-feed-card.is-anonymous{
  border:1px dashed rgba(249,95,133,0.38);
  border-radius:12px;
  padding:14px 12px;
  margin-top:12px;
}
.showup-feed-card.is-sage{
  background:rgba(249,95,133,0.05);
  border-color:rgba(249,95,133,0.14);
}
.showup-feed-card.is-pulse{
  background:linear-gradient(135deg,rgba(255,250,252,0.98),rgba(255,239,245,0.94));
  border-color:rgba(249,95,133,0.32);
}
.showup-feed-card.is-recap{
  padding:18px;
  background:linear-gradient(135deg,#fff0f6,#ffe0eb);
  border-color:rgba(249,95,133,0.36);
}
.showup-feed-card.is-activity{
  padding:10px 14px;
  background:rgba(249,95,133,0.04);
  border-color:rgba(249,95,133,0.10);
  border-radius:10px;
}
.showup-pulse-label{
  margin:0 0 8px;
  font-size:10px;
  font-weight:900;
  letter-spacing:.12em;
  text-transform:uppercase;
  color:#f95f85;
}
.showup-feed-author{
  display:flex;
  gap:10px;
  align-items:center;
  min-width:0;
  width:100%;
  flex:1 1 auto;
}
.showup-feed-header-main{
  min-width:0;
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  justify-content:center;
  gap:2px;
  width:100%;
  overflow:hidden;
}
.showup-post-edit{
  display:grid;
  gap:8px;
  margin-top:12px;
}
.showup-post-edit-actions{
  display:flex;
  justify-content:flex-end;
  gap:8px;
}
.showup-post-edit-actions button{
  min-height:32px;
  border-radius:999px;
  border:1px solid rgba(249,95,133,0.22);
  background:transparent;
  color:#f95f85;
  padding:0 12px;
  font-size:12px;
  font-weight:800;
  font-family:'DM Sans',sans-serif;
  cursor:pointer;
}
.showup-feed-name{
  margin:0;
  font-family:'Syne',sans-serif;
  font-size:13px;
  font-weight:700;
  color:#4d3142;
  flex:1 1 auto;
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.showup-feed-time{
  margin:0;
  font-size:12px;
  color:#9a7088;
  white-space:nowrap;
}
.showup-feed-text{
  margin:12px 0 0;
  font-size:14px;
  line-height:1.65;
  color:#4d3142;
  white-space:pre-wrap;
  overflow-wrap:anywhere;
  word-break:break-word;
}
.showup-feed-media-wrapper{
  width:100%;
  overflow:hidden;
  border-radius:8px;
  margin-top:12px;
  background:#fff;
}
.showup-feed-image{
  width:100%;
  max-width:100%;
  max-height:420px;
  object-fit:contain;
  border-radius:8px;
  border:none;
  margin-top:0;
  cursor:pointer;
  background:#fff;
  display:block;
}
.showup-feed-reactions{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  width:100%;
  min-width:0;
  box-sizing:border-box;
  margin-top:14px;
  padding-top:12px;
  border-top:1px solid rgba(77,49,66,0.08);
  flex-wrap:nowrap;
}
.showup-reaction-chip,
.showup-comment-toggle{
  min-height:32px;
  border-radius:999px;
  padding:0;
  color:#4d3142;
  font-size:12px;
  font-weight:700;
  cursor:pointer;
  display:inline-flex;
  align-items:center;
  gap:6px;
  background:#fff;
  flex-shrink:0;
}
.showup-reaction-chip{
  border:none;
  background:transparent;
  padding:0;
  color:#9a7088;
  min-width:auto;
}
.showup-reaction-chip.is-active{
  background:transparent;
  color:#3b82f6;
}
.showup-reaction-chip.is-active svg{
  fill:#3b82f6;
  stroke:#3b82f6;
}
.showup-reaction-picker{
  position:absolute;
  left:0;
  bottom:42px;
  display:flex;
  gap:6px;
  padding:8px;
  border:1px solid rgba(249,95,133,0.18);
  border-radius:999px;
  background:#fff;
  box-shadow:0 14px 34px rgba(77,49,66,0.14);
  z-index:4;
}
.showup-reaction-option{
  width:34px;
  height:34px;
  border:none;
  border-radius:50%;
  background:rgba(249,95,133,0.08);
  display:grid;
  place-items:center;
  font-size:17px;
  cursor:pointer;
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
.showup-comment-delete{
  color:#b29cab;
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
  display:inline-flex;
  align-items:center;
  gap:4px;
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
.showup-comment-sheet{
  width:100%;
  max-width:560px;
  height:58dvh;
  max-height:min(76dvh, 620px);
  background:#fff;
  border-radius:20px 20px 0 0;
  padding:14px 14px calc(18px + env(safe-area-inset-bottom, 0px));
  box-sizing:border-box;
  display:grid;
  grid-template-rows:auto minmax(0,1fr) auto;
  gap:12px;
  box-shadow:0 -22px 48px rgba(77,49,66,0.14);
  touch-action:pan-y;
  transition:height .22s ease, max-height .22s ease;
}
.showup-comment-sheet.is-expanded{
  height:75dvh;
  max-height:75dvh;
}
.showup-comment-sheet-list{
  overflow-y:auto;
  display:grid;
  gap:10px;
  padding-right:2px;
}
.showup-comment-sheet-compose{
  display:grid;
  gap:8px;
  border-top:1px solid rgba(77,49,66,0.08);
  padding-top:10px;
}
.showup-comment-inline{
  display:grid;
  grid-template-columns:auto 1fr auto auto auto;
  gap:8px;
  align-items:center;
}
.showup-comment-icon-btn,
.showup-comment-round-send{
  width:36px;
  height:36px;
  border-radius:50%;
  border:1px solid rgba(249,95,133,0.24);
  background:#fff;
  color:#f95f85;
  display:grid;
  place-items:center;
  cursor:pointer;
  font-weight:900;
  flex-shrink:0;
}
.showup-comment-round-send{
  border:none;
  background:linear-gradient(135deg,#f95f85,#ff8ca8);
  color:#fff;
}
.showup-mention-list{
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}
.showup-mention-list button{
  border:1px solid rgba(249,95,133,0.22);
  background:#fff7fa;
  color:#8b6275;
  border-radius:999px;
  padding:5px 9px;
  font-size:11px;
  font-weight:800;
  cursor:pointer;
}
.showup-comment-image-preview{
  width:64px;
  height:64px;
  object-fit:cover;
  border-radius:10px;
  border:1px solid rgba(249,95,133,0.22);
}
.showup-rank-row{
  display:grid;
  grid-template-columns:34px 42px minmax(0,1fr) auto auto;
  align-items:center;
  gap:10px;
  padding:12px;
  border:1px solid rgba(249,95,133,0.16);
  border-radius:14px;
  background:rgba(255,255,255,0.72);
}
.showup-rank-row:first-child{
  border-color:rgba(231,186,73,.38);
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
.showup-mini-done-btn:focus-visible,
.showup-tab:focus-visible,
.showup-bell-btn:focus-visible,
.showup-photo-btn:focus-visible,
.showup-post-btn:focus-visible,
.showup-post-menu-btn:focus-visible,
.showup-comment-send:focus-visible,
.showup-comment-toggle:focus-visible,
.showup-reaction-chip:focus-visible,
.showup-reaction-option:focus-visible,
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
.showup-exit-backdrop{
  position:fixed;
  inset:0;
  background:rgba(41,18,31,.28);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:21;
  padding:20px;
  box-sizing:border-box;
  backdrop-filter:blur(8px);
}
.showup-exit-modal{
  width:min(420px, 100%);
  border:1px solid rgba(249,95,133,0.22);
  border-radius:18px;
  background:#fff;
  padding:20px;
  box-shadow:0 22px 58px rgba(77,49,66,0.18);
}
.showup-exit-title{
  margin:0 0 14px;
  font-family:'Syne',sans-serif;
  font-size:20px;
  font-weight:800;
  color:#4d3142;
  text-align:left;
}
.showup-exit-options{
  display:grid;
  gap:8px;
}
.showup-exit-option{
  width:100%;
  border:1px solid rgba(249,95,133,0.18);
  border-radius:12px;
  background:#fff;
  padding:16px;
  text-align:left;
  cursor:pointer;
  font-family:'DM Sans',sans-serif;
  color:#4d3142;
}
.showup-exit-option strong{
  display:flex;
  align-items:center;
  gap:7px;
  font-size:15px;
  margin-bottom:4px;
}
.showup-exit-option strong span{
  display:inline;
  color:inherit;
  font-size:inherit;
}
.showup-exit-option span{
  display:block;
  font-size:12px;
  color:#9a7088;
  line-height:1.45;
}
.showup-exit-cancel{
  width:100%;
  min-height:48px;
  margin-top:0;
  border:1px solid rgba(226,221,224,1);
  border-radius:12px;
  background:#f3f1f2;
  color:#9a7088;
  font-weight:800;
  font-family:'DM Sans',sans-serif;
  cursor:pointer;
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
.showup-anon input{accent-color:#f95f85; margin-top:2px}
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
  width:100%;
  max-width:100%;
  box-sizing:border-box;
  overflow:hidden;
  overflow-wrap:anywhere;
}
.showup-rank-roles{
  display:flex;
  flex-wrap:wrap;
  gap:5px;
  margin-top:6px;
}
.showup-rank-role-chip{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  border-radius:999px;
  padding:5px 7px;
  color:#b98097;
  background:rgba(249,95,133,0.08);
  border:1px solid rgba(249,95,133,0.18);
  font-size:10px;
  font-weight:900;
  line-height:1;
  white-space:nowrap;
}
.showup-rank-role-chip.is-leader{
  color:#9a6500;
  background:linear-gradient(135deg,#fff7d6,#ffe8a3);
  border-color:rgba(210,153,30,0.28);
}
.showup-toast-stack{
  position:fixed;
  top:calc(14px + env(safe-area-inset-top, 0px));
  left:50%;
  transform:translateX(-50%);
  width:min(440px, calc(100% - 24px));
  z-index:40;
  pointer-events:none;
}
.showup-progress-toast{
  width:100%;
  border:1px solid rgba(249,95,133,0.18);
  border-radius:10px;
  background:rgba(249,95,133,0.12);
  color:#f95f85;
  padding:10px 16px;
  font-size:13px;
  font-weight:700;
  box-shadow:0 10px 24px rgba(77,49,66,0.12);
  animation:showup-toast-in .24s ease both, showup-toast-out .24s ease 2.76s forwards;
  pointer-events:none;
}
.showup-nudge-toast{
  width:100%;
  border:1px solid rgba(249,95,133,0.34);
  border-radius:16px;
  background:#fff;
  box-shadow:0 18px 44px rgba(77,49,66,0.18);
  padding:12px;
  display:grid;
  grid-template-columns:auto minmax(0,1fr) auto;
  align-items:center;
  gap:10px;
  animation:showup-toast-in .24s ease both;
  pointer-events:auto;
}
.showup-nudge-toast-text{
  min-width:0;
}
.showup-nudge-toast-name{
  margin:0 0 2px;
  font-size:12px;
  font-weight:800;
  color:#4d3142;
}
.showup-nudge-toast-message{
  margin:0;
  font-size:12px;
  line-height:1.4;
  color:#8b6275;
}
.showup-nudge-toast-close,
.showup-lightbox-close{
  border:none;
  background:transparent;
  cursor:pointer;
  font-family:'DM Sans',sans-serif;
}
.showup-nudge-toast-close{
  width:34px;
  height:34px;
  border-radius:50%;
  color:#9a7088;
  font-size:20px;
}
@keyframes showup-toast-in{
  from{opacity:0;transform:translateY(-14px)}
  to{opacity:1;transform:translateY(0)}
}
@keyframes showup-toast-out{
  from{opacity:1;transform:translateY(0)}
  to{opacity:0;transform:translateY(-10px)}
}
.showup-bottom-toast{
  position:fixed;
  left:50%;
  bottom:calc(18px + env(safe-area-inset-bottom, 0px));
  transform:translateX(-50%);
  width:min(420px, calc(100% - 24px));
  border-radius:12px;
  background:#4d3142;
  color:#fff;
  padding:12px 16px;
  font-size:13px;
  font-weight:700;
  text-align:center;
  box-shadow:0 14px 34px rgba(77,49,66,0.22);
  z-index:45;
  animation:showup-toast-in .24s ease both, showup-toast-out .24s ease 1.76s forwards;
}
.showup-create-modal{
  width:min(420px, 100%);
  border:1px solid rgba(249,95,133,0.18);
  border-radius:18px;
  background:#fff;
  padding:20px;
  box-shadow:0 22px 58px rgba(77,49,66,0.18);
  display:grid;
  gap:14px;
}
.showup-lightbox{
  position:fixed;
  inset:0;
  z-index:50;
  background:rgba(0,0,0,0.92);
  display:flex;
  align-items:center;
  justify-content:center;
  padding:24px;
  box-sizing:border-box;
}
.showup-lightbox img{
  max-width:100%;
  max-height:100%;
  object-fit:contain;
  border-radius:12px;
}
.showup-lightbox-close{
  position:absolute;
  top:calc(14px + env(safe-area-inset-top, 0px));
  right:14px;
  width:44px;
  height:44px;
  border-radius:50%;
  background:rgba(255,255,255,0.14);
  color:#fff;
  font-size:28px;
  line-height:1;
}
@media (max-width: 767px){
  .showup-root{
    min-height:auto;
  }
  .showup-shell{
    max-width:100%;
    padding:12px 12px 20px;
    min-height:0;
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
    grid-template-columns:42px minmax(0,1fr);
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
    grid-template-columns:1fr 1fr;
    gap:8px;
  }
  .showup-checkin-btn,
  .showup-done-btn{
    min-height:46px;
    font-size:13px;
  }
  .showup-status-actions{
    grid-template-columns:1fr 1fr;
    gap:8px;
  }
  .showup-feed-reactions{
    align-items:center;
    flex-direction:row;
    flex-wrap:nowrap;
  }
  .showup-comment-sheet{
    max-width:100%;
    height:58dvh;
    max-height:58dvh;
    min-height:0;
    border-radius:20px 20px 0 0;
    padding-bottom:calc(18px + env(safe-area-inset-bottom, 0px));
  }
  .showup-comment-sheet.is-expanded{
    height:75dvh;
    max-height:75dvh;
  }
  .showup-member-grid{
    grid-template-columns:repeat(2, minmax(0, 1fr));
    justify-content:stretch;
    gap:12px;
  }
  .showup-member-card{
    width:100%;
    min-height:118px;
    padding:20px 12px;
    border-radius:12px;
  }
  .showup-feed-image{
    max-height:420px;
  }
  .showup-feed-header-main{
    gap:6px;
  }
  .showup-feed-time{
    font-size:12px;
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
  .showup-root{
    min-height:calc(100vh - 56px);
  }
  .showup-shell{
    flex:1;
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
  { id: 'personal-growth', name: 'Personal Growth', pillar: 'Personal Growth', description: 'Learning, reading, creativity, self-development', roomColor: '#5e8f64' },
  { id: 'health-fitness', name: 'Health & Fitness', pillar: 'Health & Fitness', description: 'Body, food, sleep, gym, energy', roomColor: '#f25e92' },
  { id: 'career-business', name: 'Career & Business', pillar: 'Career & Business', description: 'Job search, entrepreneurship, income streams', roomColor: '#7a58b0' },
  { id: 'wealth', name: 'Wealth', pillar: 'Wealth', description: 'Savings, investing, debt, budgeting', roomColor: '#d4773a' },
  { id: 'relationships', name: 'Relationships', pillar: 'Relationships', description: 'Love, family, friendships, community', roomColor: '#e07b9f' },
  { id: 'inner-life', name: 'Inner Life', pillar: 'Inner Life', description: 'Spirituality, mindfulness, mental health', roomColor: '#4a7fc1' },
]

const ROOM_ICONS = {
  'health-fitness': Dumbbell,
  'career-business': BriefcaseBusiness,
  wealth: HandCoins,
  relationships: HeartHandshake,
  'inner-life': Sparkles,
  'personal-growth': Sprout,
}

function getNudgeTemplates(member) {
  const name = String(member?.display_name || 'you').split(' ')[0] || 'you'
  return [
    `We are waiting on you, ${name}. Are you coming online to do your task today?`,
    `${name}, come show up today. One small task still counts.`,
    `Checking on you, ${name}. Your room is active today.`,
    `${name}, do not disappear on your streak. Come in when you can.`,
  ]
}

const REACTION_OPTIONS = [
  { key: 'like', label: 'Like', emoji: '\u{1F44D}' },
  { key: 'clap', label: 'Clap', emoji: '\u{1F44F}' },
  { key: 'love', label: 'Love', emoji: '\u2764\uFE0F' },
  { key: 'laugh', label: 'Laugh', emoji: '\u{1F602}' },
  { key: 'smile', label: 'Smile', emoji: '\u{1F60A}' },
]

const confessionByPillar = {
  'Personal Growth': "What habit did you promise yourself this week that you didn't follow through on? No judgment - just say it.",
  'Health & Fitness': "What did you eat or skip this week that you know wasn't aligned? Drop it here and move on.",
  'Career & Business': 'What opportunity did you hesitate on this week? What actually stopped you?',
  Wealth: "What did you spend money on this week that didn't align with where you're trying to go?",
  Relationships: 'What did you avoid saying or doing this week that you know you should have?',
  'Inner Life': 'What truth did you keep from yourself this week? This is the safe space to say it.',
}

const knowledgeByPillar = {
  'Personal Growth': [
    "Identity before action. You don't journal because you're disciplined. You journal because you're becoming someone who does.",
    "The reason most people don't finish things isn't laziness. It's unclear next steps. What is your next step today - not this week, today?",
    "Consistency over 30 days rewires how you see yourself. You're not building a habit. You're building an identity.",
    'The gap between who you are and who you want to be closes one small decision at a time. Make one today.',
  ],
  'Health & Fitness': [
    'Rest is not the enemy of progress. Chronic under-recovery is. Are you sleeping enough to actually rebuild?',
    'Protein timing matters less than people think. Total daily intake matters more. Are you hitting yours?',
    'The workout you do consistently beats the perfect workout you do twice. Show up even when it is small.',
    'Your body keeps score. What you eat, how you sleep, how you move - it compounds. So does neglect.',
  ],
  'Career & Business': [
    'The most underpaid skill in business: following up. One follow-up has a higher ROI than most strategies.',
    'You do not need a perfect plan. You need a clear next action and the discipline to do it today.',
    'Visibility is a skill. The work is not enough if no one knows it exists. Who needs to know what you are building?',
    'The women who move fastest are not the ones who know the most. They are the ones who act before they feel ready.',
  ],
  Wealth: [
    'Saving 20% of nothing is nothing. Income expansion and expense reduction work together - not one or the other.',
    "The wealth gap isn't just about money. It's about financial literacy that wasn't passed down. You're learning what wasn't taught.",
    'Investing is not for people who have money left over. It is a decision you make before you spend anything else.',
    'Your relationship with money is emotional before it is mathematical. What story did you grow up believing about it?',
  ],
  Relationships: [
    'You cannot out-give your way into reciprocity. Boundaries are not walls - they are the terms under which you stay.',
    'The people around you set the ceiling on what feels normal. Normal should feel like growth, not survival.',
    'Saying what you need is not demanding. Silence is not peace - it is just delayed resentment.',
    'Who you spend time with is a decision. Passive proximity is still a choice.',
  ],
  'Inner Life': [
    'Stillness is not laziness. The women who know themselves make better decisions, faster.',
    'You cannot pour from a place you have not filled. What fills you - not what should, what actually does?',
    'Healing is not linear and it is not a destination. It is the practice of returning to yourself daily.',
    'Your intuition has been right more than you have given it credit for. What is it telling you right now?',
  ],
}

const WEEKLY_PULSE = {
  Monday: {
    format: 'Intention Drop',
    prompt: pillar => `It's Monday. What's one thing you will finish this week in your ${pillar} journey? Drop it here - the room is your witness.`,
  },
  Tuesday: {
    format: 'Action Check',
    prompt: pillar => `What did you actually do yesterday toward your ${pillar} goal? One sentence. Be honest.`,
  },
  Wednesday: {
    format: 'Confession Night',
    prompt: pillar => confessionByPillar[pillar] || confessionByPillar['Personal Growth'],
  },
  Thursday: {
    format: 'Knowledge Drop',
    content: (pillar, weekIndex) => (knowledgeByPillar[pillar] || knowledgeByPillar['Personal Growth'])[weekIndex % 4],
  },
  Friday: {
    format: 'Proof Day',
    prompt: pillar => `It's Proof Day. Post what you built this week - a photo, a result, a win, anything real. The room needs to see it.`,
  },
  Saturday: {
    format: 'Rest & Reflect',
    prompt: pillar => `Rest is part of the work. What's one thing you're proud of from this week in your ${pillar} journey?`,
  },
  Sunday: {
    format: 'Weekly Recap',
    content: 'auto-generated',
  },
}

const MAX_ROOM_SIZE = 9999

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function safeArray(value) {
  return Array.isArray(value) ? value : []
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.warn('Show Up storage write skipped', key, error)
    return false
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    // Best effort cleanup only.
  }
}

function safeJsonParse(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function compactFeedPostsForStorage(posts) {
  return (Array.isArray(posts) ? posts : [])
    .slice(0, 100)
    .map(post => ({
      ...post,
      image: post?.image || '',
      system: Boolean(post?.system),
      pulseFormat: post?.pulseFormat || '',
      pulseLabel: post?.pulseLabel || '',
      targetUserId: post?.targetUserId || '',
      postStyle: post?.postStyle || '',
      comments: safeArray(post?.comments).slice(0, 40).map(comment => ({
        ...comment,
        replies: safeArray(comment?.replies).slice(0, 20),
      })),
    }))
}

function persistFeedPosts(key, posts) {
  const compactPosts = compactFeedPostsForStorage(posts)
  if (safeWrite(key, compactPosts)) return
  safeRemove(key)
  safeWrite(key, compactPosts)
}

function cacheRoomFeedPost(roomName, post) {
  if (!roomName || !post?.id) return
  const key = getFeedStorageKey(roomName)
  const cachedPosts = safeArray(safeRead(key, []))
  persistFeedPosts(key, mergeFeedPosts([post], cachedPosts))
}

function persistMockMembers(key, members) {
  const cleanMembers = (Array.isArray(members) ? members : [])
    .filter(member => !isPlaceholderMember(member))
    .slice(0, 24)
  if (safeWrite(key, cleanMembers)) return
  safeRemove(key)
  safeWrite(key, cleanMembers.slice(0, 12))
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

function getStoredActiveRoom() {
  try {
    return localStorage.getItem('showup_active_room') || ''
  } catch {
    return ''
  }
}

function setStoredActiveRoom(roomName) {
  try {
    if (roomName) localStorage.setItem('showup_active_room', roomName)
    else localStorage.removeItem('showup_active_room')
  } catch {
    // Best effort only.
  }
}

function getDateKeyDaysAgo(daysAgo) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getLocalDayName(date = new Date()) {
  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

function getIsoWeekNumber(date = new Date()) {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNumber = copy.getUTCDay() || 7
  copy.setUTCDate(copy.getUTCDate() + 4 - dayNumber)
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1))
  return Math.ceil((((copy - yearStart) / 86400000) + 1) / 7)
}

function getCurrentWeekDateKeys() {
  const today = new Date()
  const mondayOffset = (today.getDay() + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - mondayOffset)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
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

function getUuid() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    // Fallback below.
  }
  return `showup-${uid()}-${Date.now()}`
}

function dataUrlToFile(dataUrl, fallbackName = 'room-progress.png') {
  const [meta = '', data = ''] = String(dataUrl || '').split(',')
  const mime = meta.match(/data:(.*?);base64/)?.[1] || 'image/png'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new File([bytes], fallbackName, { type: mime })
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

function getStoredProfileName() {
  const directName = String(localStorage.getItem('phasr_user_name') || '').trim()
  if (directName) return directName

  const storedProfile = safeJsonParse(localStorage.getItem('phasr_profile'), null)
  const profileName = String(
    storedProfile?.full_name ||
    storedProfile?.display_name ||
    storedProfile?.name ||
    ''
  ).trim()
  if (profileName) return profileName

  const cachedUser = safeJsonParse(localStorage.getItem('phasr_cached_user'), null)
  const cachedName = String(
    cachedUser?.user_metadata?.full_name ||
    cachedUser?.user_metadata?.name ||
    cachedUser?.email?.split('@')?.[0] ||
    ''
  ).trim()
  if (cachedName) return cachedName

  const board = getActiveBoard()
  return String(
    board?.userName ||
    board?.displayName ||
    board?.profile?.name ||
    board?.profile?.full_name ||
    ''
  ).trim()
}

function isPlaceholderMember(member) {
  return !String(member?.display_name || '').trim() || String(member?.display_name || '').trim() === 'User'
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

function incrementCurrentStreak() {
  const current = safeRead('phasr_streak', {})
  const previous = Number(current?.current || 0)
  const next = (Number.isFinite(previous) ? previous : 0) + 1
  safeWrite('phasr_streak', {
    ...current,
    current: next,
    lastCompleted: getTodayKey(),
  })
  return next
}

function getFeedStorageKey(roomName) {
  return `showup_feed_${normalize(roomName)}`
}

function getRanksStorageKey(roomName) {
  return `showup_ranks_${normalize(roomName)}`
}

function getWaitlistStorageKey(roomName) {
  return `showup_waitlist_${normalize(roomName)}`
}

function getRoomActivityStorageKey(roomName) {
  return `showup_activity_${normalize(roomName)}`
}

function getRoomStreakStorageKey(roomName) {
  return `showup_room_streak_${normalize(roomName)}`
}

function getPulseStorageKey(roomName) {
  return `showup_pulse_${normalize(roomName)}_date`
}

function getPulseIndexStorageKey(roomName) {
  return `showup_knowledge_${normalize(roomName)}_index`
}

function getAbsentPostStorageKey(roomName, dateKey) {
  return `showup_absent_posts_${normalize(roomName)}_${dateKey}`
}

function getWeeklyRecapStorageKey(roomName) {
  return `showup_recap_${normalize(roomName)}_week`
}

function getActiveRoomStorageKey(userId) {
  return `showup_active_room_${normalize(userId || 'local-user')}`
}

function getLastDoneDateStorageKey(roomName, userId) {
  return `showup_last_done_${normalize(roomName)}_${normalize(userId || 'local-user')}`
}

function getDailyAbsencePromptKey(roomName, dateKey) {
  return `showup_daily_absence_${normalize(roomName)}_${dateKey}`
}

function getCheckInPostStorageKey(roomName, userId, checkInTime) {
  return `showup_checkin_posted_${normalize(roomName)}_${normalize(userId)}_${normalize(checkInTime)}`
}

function getRoomId(roomName) {
  return normalize(roomName)
}

function getPillarFromRoom(roomName) {
  const found = ROOM_DEFINITIONS.find(room => normalize(room.name) === normalize(roomName))
  return found?.pillar || found?.name || roomName || 'Personal Growth'
}

function getRoomEnergyState(doneCount) {
  if (doneCount === 0) return { label: 'Quiet', emoji: '🌙' }
  if (doneCount <= 2) return { label: 'Warming Up', emoji: '☁️' }
  if (doneCount <= 5) return { label: 'Focused', emoji: '🎯' }
  if (doneCount <= 8) return { label: 'On Fire', emoji: '🔥' }
  if (doneCount <= 11) return { label: 'Locked In', emoji: '⚡' }
  return { label: 'Full Send', emoji: '💥' }
}

function getRoomTitleFromStreak(count) {
  if (count >= 90) return 'Unbreakable'
  if (count >= 60) return 'Discipline Circle'
  if (count >= 30) return 'Locked In'
  if (count >= 14) return 'Building Together'
  if (count >= 7) return 'Momentum Room'
  return ''
}

function getRoomStreakLabel(streak) {
  const count = Math.max(0, Number(streak?.count || 0))
  if (count <= 0) return ''
  if (count <= 1) return 'Room streak: Day 1'
  return `\u{1F525} Room streak: ${count} days`
}

function readRoomStreak(roomName) {
  return safeRead(getRoomStreakStorageKey(roomName), { count: 0, lastActiveDate: '' })
}

function updateRoomStreak(roomName, dateKey = getTodayKey()) {
  const current = readRoomStreak(roomName)
  if (current.lastActiveDate === dateKey) return current
  const last = current.lastActiveDate ? new Date(`${current.lastActiveDate}T00:00:00`) : null
  const today = new Date(`${dateKey}T00:00:00`)
  const gap = last ? Math.round((today - last) / 86400000) : 0
  const next = {
    count: gap === 1 ? Number(current.count || 0) + 1 : 1,
    lastActiveDate: dateKey,
  }
  safeWrite(getRoomStreakStorageKey(roomName), next)
  return next
}

function addRoomActivity(roomName, event) {
  const current = safeArray(safeRead(getRoomActivityStorageKey(roomName), []))
  const next = [{ id: uid(), roomName, createdAt: new Date().toISOString(), ...event }, ...current].slice(0, 500)
  safeWrite(getRoomActivityStorageKey(roomName), next)
  return next
}

function getRoomActivity(roomName) {
  return safeArray(safeRead(getRoomActivityStorageKey(roomName), []))
}

function getMockMemberStorageKey(roomName) {
  return `showup_members_${normalize(roomName)}`
}

function getCreatedRoomsKey() {
  return 'showup_created_rooms'
}

function getJoinedRoomsKey(userId) {
  return `showup_joined_rooms_${userId || 'local-user'}`
}

function getNotificationStorageKey(userId) {
  return `showup_notifications_${userId || 'local-user'}`
}

function getRoomNudgesStorageKey(roomName, userId) {
  return `showup_nudges_${normalize(roomName)}_${normalize(userId || 'local-user')}`
}

function getPresenceStorageKey(roomName, userId) {
  return `showup_presence_${normalize(roomName)}_${normalize(userId)}`
}

function getProfile(user, authUser) {
  const storedName = getStoredProfileName()
  const storedId =
    localStorage.getItem('phasr_active_user') ||
    safeJsonParse(localStorage.getItem('phasr_cached_user'), null)?.id ||
    safeJsonParse(localStorage.getItem('phasr_cached_user'), null)?.email ||
    ''
  const displayName =
    authUser?.user_metadata?.full_name ||
    authUser?.email?.split('@')[0] ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    storedName ||
    'User'
  const profileId = authUser?.id || user?.id || storedId || 'local-user'
  const extra = safeJsonParse(localStorage.getItem(`phasr_showup_profile_${normalize(profileId)}`), {})
  const globalCache = safeJsonParse(localStorage.getItem('phasr_profile_cache'), {})
  return {
    id: profileId,
    name: globalCache.display_name || displayName,
    initials: buildInitials(globalCache.display_name || displayName),
    avatar: globalCache.avatar_url || extra.avatar || '',
    about: globalCache.bio || extra.about || '',
  }
}

function saveProfileExtra(profileId, data) {
  if (!profileId) return
  safeWrite(`phasr_showup_profile_${normalize(profileId)}`, data)
}

function getDmKey(idA, idB) {
  return `phasr_dm_${[normalize(idA), normalize(idB)].sort().join('_')}`
}

function loadDmMessages(idA, idB) {
  return safeArray(safeRead(getDmKey(idA, idB), []))
}

function saveDmMessage(idA, idB, msg) {
  const current = loadDmMessages(idA, idB)
  const next = [...current, msg].slice(-200)
  safeWrite(getDmKey(idA, idB), next)
  return next
}

function buildMockMember(profile, roomName) {
  if (profile.name === 'User') return null
  return {
    room_name: roomName,
    user_id: profile.id,
    display_name: profile.name,
    initials: profile.initials,
    checked_in: false,
    check_in_time: '',
    task_done: false,
    task_done_time: '',
    joined_at: new Date().toISOString(),
    streak_count: getCurrentStreakCount(),
  }
}

function getMemberStatus(member) {
  if (member?.task_done) return 'done'
  return 'idle'
}

function readPresence(roomName, userId) {
  const value = safeRead(getPresenceStorageKey(roomName, userId), null)
  if (!value || !roomName || !userId) return { status: 'none', lastSeen: 0 }
  const lastSeen = Number(value?.lastSeen || 0)
  if (!lastSeen || (Date.now() - lastSeen) > 5 * 60 * 1000) {
    return { status: 'inactive', lastSeen }
  }
  return {
    status: value?.status === 'active' ? 'active' : 'inactive',
    lastSeen,
  }
}

function writePresence(roomName, userId, status = 'active') {
  if (!roomName || !userId) return
  safeWrite(getPresenceStorageKey(roomName, userId), {
    status,
    lastSeen: Date.now(),
  })
}

function clearPresence(roomName, userId) {
  if (!roomName || !userId) return
  safeRemove(getPresenceStorageKey(roomName, userId))
}

function getPresenceStatus(roomName, member) {
  if (!roomName || !member?.user_id || !member?.checked_in) return 'none'
  return readPresence(roomName, member.user_id).status
}

function getReactionSummary(reactions) {
  return REACTION_OPTIONS
    .map(reaction => ({
      ...reaction,
      count: safeArray(reactions?.[reaction.key]).length,
    }))
    .filter(reaction => reaction.count > 0)
}

function getMediaKind(value) {
  const media = String(value || '').trim().toLowerCase()
  if (!media) return ''
  if (media.startsWith('data:video/')) return 'video'
  if (media.startsWith('data:image/')) return 'image'
  if (/\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(media)) return 'video'
  return 'image'
}

function formatRoomTitle(value) {
  return String(value || '')
    .replace(/^["'`\s]+|["'`\s]+$/g, '')
    .replace(/["'`]+/g, '')
    .trim()
}

function dedupeByIdOrTimestamp(items) {
  const seen = new Set()
  return (Array.isArray(items) ? items : []).filter(item => {
    const key = item?.id || `${item?.createdAt || ''}:${item?.text || ''}:${item?.authorId || ''}`
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function mergeFeedPosts(remotePosts, cachedPosts) {
  const merged = new Map()
  const localItems = Array.isArray(cachedPosts) ? cachedPosts : []

  remotePosts.forEach(post => {
    const localMatch = localItems.find(item => (
      item?.id === post?.id ||
      (
        item?.createdAt === post?.createdAt &&
        item?.authorId === post?.authorId &&
        item?.text === post?.text
      )
    ))
    merged.set(post.id, {
      ...localMatch,
      ...post,
      image: post?.image || localMatch?.image || '',
      reactions: localMatch?.reactions || post?.reactions || {},
      comments: safeArray(localMatch?.comments).map(comment => ({
        ...comment,
        reactions: comment.reactions || { love: [] },
        replies: safeArray(comment.replies),
      })),
    })
  })

  localItems.forEach(post => {
    const existing = [...merged.values()].find(item => (
      item?.id === post?.id ||
      (
        item?.createdAt === post?.createdAt &&
        item?.authorId === post?.authorId &&
        item?.text === post?.text
      )
    ))
    if (existing) {
      if (!existing.image && post?.image) {
        merged.set(existing.id, { ...existing, image: post.image })
      }
      return
    }
    merged.set(post.id, post)
  })

  return [...merged.values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

function computeRoomRoles(members, roomName) {
  const activity = getRoomActivity(roomName)
  const weekDates = new Set(getCurrentWeekDateKeys())
  const today = getTodayKey()
  const roles = {}
  const realMembers = safeArray(members).filter(member => !isPlaceholderMember(member))
  realMembers.forEach(member => { roles[member.user_id] = [] })

  const leader = [...realMembers].sort((a, b) => Number(b.streak_count || 0) - Number(a.streak_count || 0))[0]
  if (leader && Number(leader.streak_count || 0) > 0) roles[leader.user_id]?.push('Room Leader')

  realMembers.forEach(member => {
    const userEvents = activity.filter(event => event.userId === member.user_id)
    const dones = userEvents.filter(event => event.type === 'done')
    const doneDates = new Set(dones.map(event => event.date))
    const thisWeekDones = [...weekDates].filter(date => doneDates.has(date)).length
    const totalDoneDays = Math.max(dones.length, Number(member.task_done ? 1 : 0))
    const completionRate = totalDoneDays ? dones.length / totalDoneDays : 0
    const doneToday = member.task_done || doneDates.has(today)
    const missedBeforeToday = [1, 2, 3].every(daysAgo => !doneDates.has(getDateKeyDaysAgo(daysAgo)))
    const earlyDates = new Set(dones.filter(event => Number(String(event.time || '99').slice(0, 2)) < 8).map(event => event.date))
    const earlyMover = [0, 1, 2].every(daysAgo => earlyDates.has(getDateKeyDaysAgo(daysAgo)))

    if (completionRate >= 0.9 && totalDoneDays >= 3) roles[member.user_id]?.push('Discipline')
    if (thisWeekDones >= Math.min(7, weekDates.size)) roles[member.user_id]?.push('Locked In')
    if (doneToday && missedBeforeToday && dones.length > 1) roles[member.user_id]?.push('Comeback')
    if (earlyMover) roles[member.user_id]?.push('Early Mover')
  })

  const nudgeCounts = {}
  activity
    .filter(event => event.type === 'nudge' && weekDates.has(event.date))
    .forEach(event => {
      nudgeCounts[event.userId] = (nudgeCounts[event.userId] || 0) + 1
    })
  const topNudger = Object.entries(nudgeCounts).sort((a, b) => b[1] - a[1])[0]
  if (topNudger?.[0] && topNudger[1] > 0) roles[topNudger[0]]?.push('Encourager')

  const priority = ['Room Leader', 'Discipline', 'Locked In', 'Comeback', 'Encourager', 'Early Mover']
  Object.keys(roles).forEach(memberId => {
    roles[memberId] = priority.filter(role => roles[memberId].includes(role))
  })
  return roles
}

export default function ShowUp({ user, profileData: externalProfileData, onGoToDailyStreaks }) {
  const [profile, setProfile] = useState({ id: 'local-user', name: 'User', initials: 'U' })
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [activeTab, setActiveTab] = useState('live')
  const [members, setMembers] = useState([])
  const [roomCounts, setRoomCounts] = useState({})
  const [checkedIn, setCheckedIn] = useState(false)
  const [taskDone, setTaskDone] = useState(false)
  const [doneTime, setDoneTime] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedPosts, setFeedPosts] = useState([])
  const [feedReady, setFeedReady] = useState(true)
  const [postDraft, setPostDraft] = useState('')
  const [postImage, setPostImage] = useState('')
  const [toast, setToast] = useState('')
  const [pulseBanner, setPulseBanner] = useState('')
  const [commentSheetPostId, setCommentSheetPostId] = useState('')
  const [commentImage, setCommentImage] = useState('')
  const [lightboxMedia, setLightboxMedia] = useState({ url: '', kind: '' })
  const [nudgeToast, setNudgeToast] = useState(null)
  const [progressToast, setProgressToast] = useState('')
  const [bottomToast, setBottomToast] = useState('')
  const [expandedComments, setExpandedComments] = useState({})
  const [commentDrafts, setCommentDrafts] = useState({})
  const [expandedReplies, setExpandedReplies] = useState({})
  const [replyDrafts, setReplyDrafts] = useState({})
  const [heldCommentId, setHeldCommentId] = useState('')
  const [openPostMenuId, setOpenPostMenuId] = useState('')
  const [editingPostId, setEditingPostId] = useState('')
  const [editPostDraft, setEditPostDraft] = useState('')
  const [doneBusy, setDoneBusy] = useState(false)
  const [sheetState, setSheetState] = useState({ open: false, member: null })
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [notifyText, setNotifyText] = useState('')
  const [notifyAnonymous, setNotifyAnonymous] = useState(false)
  const [notifyPostToFeed, setNotifyPostToFeed] = useState(false)
  const [exitPromptOpen, setExitPromptOpen] = useState(false)
  const [createRoomModalOpen, setCreateRoomModalOpen] = useState(false)
  const [createRoomLockedOpen, setCreateRoomLockedOpen] = useState(false)
  const [createRoomName, setCreateRoomName] = useState('')
  const [createFocusAreaId, setCreateFocusAreaId] = useState(ROOM_DEFINITIONS[0].id)
  const [roomStreak, setRoomStreak] = useState({ count: 0, lastActiveDate: '' })
  const [presenceTick, setPresenceTick] = useState(0)
  const [replyTarget, setReplyTarget] = useState(null)
  const [profileEditOpen, setProfileEditOpen] = useState(false)
  const [profileAvatarDraft, setProfileAvatarDraft] = useState('')
  const [profileAboutDraft, setProfileAboutDraft] = useState('')
  const [dmSheetMember, setDmSheetMember] = useState(null)
  const [dmMessages, setDmMessages] = useState([])
  const [dmDraft, setDmDraft] = useState('')
  const [h2hMember, setH2hMember] = useState(null)
  const [subRooms, setSubRooms] = useState([])
  const [activeSubRoom, setActiveSubRoom] = useState(null)
  const [createSubRoomOpen, setCreateSubRoomOpen] = useState(false)
  const [subRoomName, setSubRoomName] = useState('')
  const [subRoomDesc, setSubRoomDesc] = useState('')
  const [subRoomLimit, setSubRoomLimit] = useState(20)
  const [subRoomPaid, setSubRoomPaid] = useState(false)
  const [subRoomPrice, setSubRoomPrice] = useState('')
  const fileInputRef = useRef(null)
  const feedViewRef = useRef(null)
  const commentFileInputRef = useRef(null)
  const commentHoldTimerRef = useRef(null)
  const commentSheetTouchStartRef = useRef(null)

  const preferredRoomName = useMemo(() => detectRoomNameFromBoard(), [])
  const rooms = useMemo(() => {
    const nextRooms = [...ROOM_DEFINITIONS]
    const preferredIndex = nextRooms.findIndex(room => room.name === preferredRoomName)
    if (preferredIndex <= 0) return nextRooms
    const preferredRoom = nextRooms[preferredIndex]
    return [preferredRoom, ...nextRooms.filter((_, index) => index !== preferredIndex)]
  }, [preferredRoomName])
  const joinedRoomName = useMemo(() => {
    const joined = safeArray(safeRead(getJoinedRoomsKey(profile.id), []))[0] || ''
    if (joined) return joined
    const localRoom = rooms.find(room => {
      const stored = safeRead(getMockMemberStorageKey(room.name), [])
      return Array.isArray(stored) && stored.some(member => member?.user_id === profile.id)
    })
    return localRoom?.name || ''
  }, [profile.id, rooms, selectedRoom, roomCounts])

  useEffect(() => {
    if (!selectedRoom) return
    setMembers([])
    setFeedPosts([])
    setCommentSheetPostId('')
    loadFeedPosts(selectedRoom)
    setRoomStreak(readRoomStreak(selectedRoom))
  }, [selectedRoom])

  useEffect(() => {
    if (activeTab !== 'feed' || !selectedRoom) return undefined
    const interval = window.setInterval(() => {
      loadFeedPosts(selectedRoom)
    }, 30000)
    return () => window.clearInterval(interval)
  }, [activeTab, selectedRoom])

  useEffect(() => {
    if (!selectedRoom) return
    persistFeedPosts(getFeedStorageKey(selectedRoom), feedPosts)
  }, [feedPosts, selectedRoom])

  useEffect(() => () => {
    if (commentHoldTimerRef.current) window.clearTimeout(commentHoldTimerRef.current)
  }, [])

  useEffect(() => {
    if (!nudgeToast) return undefined
    const timer = window.setTimeout(() => setNudgeToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [nudgeToast])

  useEffect(() => {
    if (!progressToast) return undefined
    const timer = window.setTimeout(() => setProgressToast(''), 3000)
    return () => window.clearTimeout(timer)
  }, [progressToast])

  useEffect(() => {
    if (!bottomToast) return undefined
    const timer = window.setTimeout(() => setBottomToast(''), 2000)
    return () => window.clearTimeout(timer)
  }, [bottomToast])

  useEffect(() => {
    if (!pulseBanner) return undefined
    const timer = window.setTimeout(() => setPulseBanner(''), 5000)
    return () => window.clearTimeout(timer)
  }, [pulseBanner])

  useEffect(() => {
    if (!selectedRoom || !profile?.id) return undefined
    writePresence(selectedRoom, profile.id, 'active')
    setPresenceTick(current => current + 1)
    const interval = window.setInterval(() => {
      writePresence(selectedRoom, profile.id, 'active')
      setPresenceTick(current => current + 1)
    }, 60000)
    return () => window.clearInterval(interval)
  }, [members, profile.id, selectedRoom])

  useEffect(() => {
    const onProfileUpdate = e => {
      if (!e.detail) return
      setProfile(p => ({
        ...p,
        name: e.detail.display_name || p.name,
        initials: buildInitials(e.detail.display_name || p.name),
        avatar: e.detail.avatar_url || p.avatar,
        about: e.detail.bio || p.about,
      }))
    }
    window.addEventListener('phasr-profile-updated', onProfileUpdate)
    return () => window.removeEventListener('phasr-profile-updated', onProfileUpdate)
  }, [])

  useEffect(() => {
    function showRecipientNudge(notification) {
      if (!notification || notification.toUserId !== profile.id) return
      setNudgeToast(notification)
    }

    function handleNudgeEvent(event) {
      showRecipientNudge(event.detail)
    }

    function handleStorageEvent(event) {
      if (event.key !== getNotificationStorageKey(profile.id)) return
      const notifications = safeJsonParse(event.newValue, [])
      showRecipientNudge(safeArray(notifications)[0])
    }

    window.addEventListener('phasr-showup-notification', handleNudgeEvent)
    window.addEventListener('storage', handleStorageEvent)
    return () => {
      window.removeEventListener('phasr-showup-notification', handleNudgeEvent)
      window.removeEventListener('storage', handleStorageEvent)
    }
  }, [profile.id])

  useEffect(() => {
    if (!profile?.id) return undefined
    const poll = window.setInterval(async () => {
      const nudgeRoom = selectedRoom || joinedRoomName
      if (!nudgeRoom) return
      try {
        if (supabase) {
          const { data, error } = await supabase
            .from('room_nudges')
            .select('*')
            .eq('room_id', nudgeRoom)
            .eq('to_user_id', profile.id)
            .eq('seen', false)
            .order('created_at', { ascending: false })
            .limit(1)
          if (error) throw error
          const next = safeArray(data)[0]
          if (next) {
            setNudgeToast({
              toUserId: profile.id,
              fromName: next.from_user_name,
              text: next.message,
              anonymous: false,
            })
            await supabase.from('room_nudges').update({ seen: true }).eq('id', next.id)
            return
          }
        }
      } catch (nextError) {
        console.error('Show Up nudge poll failed', nextError)
      }

      const localNudges = safeArray(safeRead(getRoomNudgesStorageKey(nudgeRoom, profile.id), []))
      const nextLocal = localNudges.find(item => !item.seen)
      if (!nextLocal) return
      setNudgeToast({
        toUserId: profile.id,
        fromName: nextLocal.fromName,
        text: nextLocal.text,
        anonymous: Boolean(nextLocal.anonymous),
      })
      safeWrite(getRoomNudgesStorageKey(nudgeRoom, profile.id), localNudges.map(item => (
        item.id === nextLocal.id ? { ...item, seen: true } : item
      )))
    }, 15000)
    return () => window.clearInterval(poll)
  }, [joinedRoomName, profile.id, selectedRoom])

  useEffect(() => {
    if (selectedRoom || !profile.id) return
    const rememberedRoom = getStoredActiveRoom() || localStorage.getItem(getActiveRoomStorageKey(profile.id))
    if (!rememberedRoom) return
    const storedMembers = safeRead(getMockMemberStorageKey(rememberedRoom), [])
    const activeMember = safeArray(storedMembers).find(member => (
      member?.user_id === profile.id
    ))
    if (!activeMember) return
    setSelectedRoom(rememberedRoom)
    setActiveTab('live')
    writePresence(rememberedRoom, profile.id, 'active')
    setPresenceTick(current => current + 1)
  }, [profile.id, selectedRoom])

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
        if (selectedRoom && !doneBusy) loadMembers(selectedRoom, profile)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile, selectedRoom, doneBusy])

  async function loadRoomCounts(nextProfile = profile) {
    if (!supabase) {
      loadRoomCountsFromLocal(nextProfile)
      return
    }

    try {
      const counts = {}
      try {
        const { data: roomsData, error: roomsError } = await supabase
          .from('rooms')
          .select('id,current_members')
        if (roomsError) throw roomsError
        ;(roomsData || []).forEach(row => {
          const room = ROOM_DEFINITIONS.find(item => item.id === row.id)
          if (!room) return
          counts[room.name] = Number(row.current_members || 0)
        })
      } catch {
        const { data, error: countsError } = await supabase
          .from('show_up_checkins')
          .select('room_name,display_name')
        if (countsError) throw countsError
        ;(data || []).forEach(row => {
          if (isPlaceholderMember(row)) return
          counts[row.room_name] = (counts[row.room_name] || 0) + 1
        })
      }
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
      const nextMembers = Array.isArray(stored) ? stored : []
      counts[room.name] = nextMembers.filter(member => !isPlaceholderMember(member)).length
    })
    setRoomCounts(counts)
  }

  async function loadMembers(roomName, nextProfile = profile) {
    if (!supabase) {
      loadMembersFromLocal(roomName, nextProfile)
      return
    }

    try {
      const { data, error: membersError } = await supabase
        .from('show_up_checkins')
        .select('*')
        .eq('room_name', roomName)
        .order('task_done_time', { ascending: false })

      if (membersError) throw membersError

      const nextMembers = (data || []).map(member => ({
        ...member,
        streak_count: member?.user_id === nextProfile.id ? getCurrentStreakCount() : Number(member?.streak_count || 0),
      }))

      if (!nextMembers.some(member => member.user_id === nextProfile.id)) {
        const fallbackMember = buildMockMember(nextProfile, roomName)
        if (fallbackMember) nextMembers.unshift(fallbackMember)
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
    const fallbackMember = buildMockMember(nextProfile, roomName)
    const nextMembers = Array.isArray(stored) && stored.length ? stored : (fallbackMember ? [fallbackMember] : [])
    if (!nextMembers.some(member => member.user_id === nextProfile.id)) {
      if (fallbackMember) nextMembers.unshift(fallbackMember)
    }
    const withStreaks = nextMembers.map(member => ({
      ...member,
      streak_count: member?.user_id === nextProfile.id ? getCurrentStreakCount() : Number(member?.streak_count || 0),
    }))
    persistMockMembers(getMockMemberStorageKey(roomName), withStreaks)
    setMembers(withStreaks)
    hydrateCurrentMember(withStreaks, nextProfile)
  }

  function hydrateCurrentMember(nextMembers, nextProfile = profile) {
    const myMember = nextMembers.find(member => member.user_id === nextProfile.id)
    const nextCheckedIn = Boolean(myMember?.checked_in)
    const nextTaskDone = Boolean(myMember?.task_done)
    setCheckedIn(nextCheckedIn)
    setTaskDone(nextTaskDone)
    if (myMember?.check_in_time && !nextTaskDone) setDoneTime('')
    if (myMember?.task_done_time) setDoneTime(myMember.task_done_time)
    if (!nextTaskDone) setDoneTime('')
  }

  function upsertLocalMember(roomName, patch) {
    const current = safeRead(getMockMemberStorageKey(roomName), [])
    const next = [...current]
    const index = next.findIndex(member => member.user_id === patch.user_id)
    if (index >= 0) next[index] = { ...next[index], ...patch }
    else {
      const fallbackMember = buildMockMember(profile, roomName)
      next.unshift({ ...(fallbackMember || {}), ...patch })
    }
    persistMockMembers(getMockMemberStorageKey(roomName), next)
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
        .from('room_feed_posts')
        .select('*')
        .eq('room_id', roomName)
        .order('created_at', { ascending: false })
        .limit(50)

      if (feedError) throw feedError

      const cachedPosts = Array.isArray(localPosts) ? localPosts : []
      const remotePosts = (data || []).map((post, index) => {
        const remoteId = String(post.id || `${post.author_id || post.user_id || 'room'}-${post.created_at || index}`)
        const remoteType = String(post.post_type || '')
        const remotePulseFormat = remoteType.startsWith('pulse:') ? remoteType.slice(6) : ''
        const remoteRecap = remoteType.startsWith('recap:')
        const remoteTargetUserId = remoteType.startsWith('nudge:') ? remoteType.slice(6) : ''
        const cached = cachedPosts.find(item => (
          item.id === remoteId ||
          (
            item.createdAt === post.created_at &&
            item.authorId === (post.author_id || post.user_id || `anon-${index}`) &&
            item.text === (post.text || post.content || '')
          )
        ))
        return {
          id: remoteId,
          authorId: post.author_id || post.user_id || `anon-${index}`,
          authorName: post.author_name || post.display_name || 'Room member',
          authorInitials: buildInitials(post.author_name || post.display_name || 'Room member'),
          anonymous: false,
          text: post.text || post.content || '',
          image: post.image_url || cached?.image || '',
          system: Boolean(post.is_system_post) || cached?.system || (post.author_name || post.display_name) === 'Sage',
          pulseFormat: remotePulseFormat || (remoteRecap ? 'Weekly Recap' : cached?.pulseFormat || ''),
          pulseLabel: remotePulseFormat
            ? `\u{1F4C5} ${remotePulseFormat.toUpperCase()}`
            : remoteRecap
              ? '\u{1F4C5} WEEKLY RECAP'
              : (cached?.pulseLabel || ''),
          targetUserId: remoteTargetUserId || cached?.targetUserId || '',
          postStyle: remoteRecap ? 'recap' : (remotePulseFormat ? 'pulse' : (cached?.postStyle || '')),
          createdAt: post.created_at || new Date().toISOString(),
          reactions: cached?.reactions || {},
          comments: safeArray(cached?.comments).map(comment => ({
            ...comment,
            reactions: comment.reactions || { love: [] },
            replies: safeArray(comment.replies),
          })),
        }
      })
      setFeedReady(true)
      setFeedPosts(mergeFeedPosts(remotePosts, cachedPosts))
    } catch (nextError) {
      console.error('Show Up feed load failed', nextError)
      setFeedReady(false)
      setFeedPosts(Array.isArray(localPosts) ? localPosts : [])
    }
  }

  async function createFeedPost({ text, image = '', anonymous = false, author = null, system = false, pulseFormat = '', pulseLabel = '', targetUserId = '', postStyle = '', roomName = '' }) {
    const createdAt = new Date().toISOString()
    const targetRoom = roomName || selectedRoom
    const postAuthor = author || {
      id: anonymous ? `anon-${uid()}` : profile.id,
      name: anonymous ? 'Anonymous \u00B7 Room' : profile.name,
      initials: anonymous ? 'AN' : profile.initials,
      avatarUrl: anonymous ? '' : (profile.avatar || ''),
    }
    const nextPost = {
      id: getUuid(),
      authorId: postAuthor.id,
      authorName: postAuthor.name,
      authorInitials: postAuthor.initials,
      authorAvatarUrl: postAuthor.avatarUrl || '',
      anonymous,
      text,
      image,
      system,
      pulseFormat,
      pulseLabel,
      targetUserId,
      postStyle,
      createdAt,
      reactions: {},
      comments: [],
    }

    const showLocally = !selectedRoom || targetRoom === selectedRoom

    if (!supabase || !targetRoom) {
      cacheRoomFeedPost(targetRoom, nextPost)
      if (showLocally) addFeedPost(nextPost)
      setFeedReady(false)
      return nextPost
    }

    try {
      const remotePostType =
        postStyle === 'recap' ? 'recap:Weekly Recap'
          : pulseFormat ? `pulse:${pulseFormat}`
            : targetUserId ? `nudge:${targetUserId}`
              : ''
      const insertPayload = {
        id: nextPost.id,
        room_id: targetRoom,
        author_id: postAuthor.id === 'sage' ? 'sage' : postAuthor.id,
        author_name: postAuthor.name,
        text,
        image_url: image || null,
        post_type: remotePostType,
        is_system_post: Boolean(system),
        created_at: createdAt,
      }
      let { data, error: insertError } = await supabase
        .from('room_feed_posts')
        .insert(insertPayload)
        .select()
        .single()

      if (insertError && /is_system_post/i.test(String(insertError.message || insertError.details || ''))) {
        const { is_system_post: _ignored, ...compatiblePayload } = insertPayload
        const retry = await supabase
          .from('room_feed_posts')
          .insert(compatiblePayload)
          .select()
          .single()
        data = retry.data
        insertError = retry.error
      }

      if (insertError) throw insertError

      const persistedPost = {
        ...nextPost,
        id: data?.id || nextPost.id,
        image: data?.image_url || nextPost.image || '',
        createdAt: data?.created_at || nextPost.createdAt,
        system: Boolean(data?.is_system_post ?? nextPost.system),
      }
      cacheRoomFeedPost(targetRoom, persistedPost)
      if (showLocally) addFeedPost(persistedPost)
      setFeedReady(true)
      return persistedPost
    } catch (nextError) {
      console.error('Show Up feed post failed', nextError)
      setFeedReady(false)
      cacheRoomFeedPost(targetRoom, nextPost)
      if (showLocally) addFeedPost(nextPost)
      return nextPost
    }
  }

  function createRoomActivityPost(text, options = {}) {
    return createFeedPost({
      text,
      image: '',
      anonymous: false,
      system: true,
      roomName: options.roomName || selectedRoom,
      author: {
        id: 'sage',
        name: 'Sage',
        initials: 'SG',
      },
      ...options,
    })
  }

  async function postWeeklyPulseIfNeeded(roomName) {
    const today = getTodayKey()
    if (localStorage.getItem(getPulseStorageKey(roomName)) === today) return
    const dayName = getLocalDayName()
    const pulse = WEEKLY_PULSE[dayName]
    if (!pulse || dayName === 'Sunday') return
    const pillar = getPillarFromRoom(roomName)
    let text = ''
    if (dayName === 'Thursday') {
      const currentIndex = Number(localStorage.getItem(getPulseIndexStorageKey(roomName)) || 0)
      text = pulse.content(pillar, currentIndex)
      safeWrite(getPulseIndexStorageKey(roomName), currentIndex + 1)
    } else {
      text = pulse.prompt(pillar)
    }
    safeWrite(getPulseStorageKey(roomName), today)
    const pulsePost = await createRoomActivityPost(text, {
      roomName,
      pulseFormat: pulse.format,
      pulseLabel: `\u{1F4C5} ${pulse.format.toUpperCase()}`,
      postStyle: 'pulse',
    })
    if (pulsePost) {
      setPulseBanner(`${pulse.format} just dropped in ${roomName}.`)
    }
  }

  async function postSilentAccountability(roomName, nextMembers) {
    const now = new Date()
    if (now.getHours() < 14) return
    const today = getTodayKey()
    const doneCount = safeArray(nextMembers).filter(member => !isPlaceholderMember(member) && member.task_done).length
    if (doneCount >= Math.ceil(MAX_ROOM_SIZE / 2)) return
    const postedKey = getDailyAbsencePromptKey(roomName, today)
    if (localStorage.getItem(postedKey)) return
    const pendingMembers = safeArray(nextMembers).filter(member => !isPlaceholderMember(member) && !member.task_done)
    if (!pendingMembers.length) return
    const leadName = pendingMembers[0]?.display_name || 'Someone'
    const othersCount = Math.max(0, pendingMembers.length - 1)
    const message = othersCount > 0
      ? `${leadName} and ${othersCount} others haven't marked done yet today. You've still got time. \u{1F49B}`
      : `${leadName} hasn't marked done yet today. You've still got time. \u{1F49B}`
    localStorage.setItem(postedKey, '1')
    await createRoomActivityPost(message, { postStyle: 'sage' })
  }

  async function postSundayRecapIfNeeded(roomName, nextRoomStreak, nextMembers = []) {
    if (getLocalDayName() !== 'Sunday') return
    const currentWeek = getIsoWeekNumber()
    if (Number(localStorage.getItem(getWeeklyRecapStorageKey(roomName)) || 0) === currentWeek) return
    const activity = getRoomActivity(roomName)
    const weekDates = new Set(getCurrentWeekDateKeys())
    const realMembers = safeArray(nextMembers).filter(member => !isPlaceholderMember(member))
    const weeklyDone = activity.filter(event => event.type === 'done' && weekDates.has(event.date))
    const byDay = {}
    weeklyDone.forEach(event => {
      const day = new Date(`${event.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' })
      byDay[day] = (byDay[day] || 0) + 1
    })
    const mostActiveDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sunday'
    const leader = [...realMembers].sort((a, b) => Number(b.streak_count || 0) - Number(a.streak_count || 0))[0]
    const completion = realMembers.length ? Math.round((weeklyDone.length / Math.max(1, realMembers.length * Math.max(1, weekDates.size))) * 100) : 0
    const text = weeklyDone.length < 3
      ? `Weekly Recap - ${roomName}\n\nWeek 1 complete. You showed up. That's everything.`
      : `Weekly Recap - ${roomName}\n\n\u2705 Total mark-dones this week: ${weeklyDone.length}\n\u{1F525} Room streak: ${Number(nextRoomStreak?.count || 0)} days\n\u{1F4C5} Most active day: ${mostActiveDay}\n\u26A1 Streak leader: ${leader?.display_name || 'Room'} - ${Number(leader?.streak_count || 0)} days\n\u{1F49B} Room completion: ${completion}%\n\nKeep going. Same room, new week.`
    safeWrite(getWeeklyRecapStorageKey(roomName), currentWeek)
    await createRoomActivityPost(text, {
      pulseFormat: 'Weekly Recap',
      pulseLabel: '\u{1F4C5} WEEKLY RECAP',
      postStyle: 'recap',
    })
  }

  async function uploadRoomFeedImage(image) {
    if (!image || !String(image).startsWith('data:') || !supabase || !selectedRoom) return image
    try {
      const file = dataUrlToFile(image, `${profile.id}-${Date.now()}.png`)
      const path = `${getRoomId(selectedRoom)}/${profile.id}-${Date.now()}.png`
      const { error: uploadError } = await supabase.storage
        .from('room-feed')
        .upload(path, file, { contentType: file.type, upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('room-feed').getPublicUrl(path)
      return data?.publicUrl || image
    } catch (nextError) {
      console.error('Show Up image upload failed', nextError)
      return image
    }
  }

  async function ensureRoomMembership(roomName) {
    const existingLocal = safeRead(getMockMemberStorageKey(roomName), [])
    const rememberJoinedRoom = () => {
      safeWrite(getJoinedRoomsKey(profile.id), [roomName])
    }
    if (Array.isArray(existingLocal) && existingLocal.some(member => member.user_id === profile.id)) {
      rememberJoinedRoom()
      return
    }

    const payload = {
      room_name: roomName,
      user_id: profile.id,
      display_name: profile.name,
      initials: profile.initials,
      checked_in: false,
      check_in_time: '',
      task_done: false,
      task_done_time: '',
      streak_count: getCurrentStreakCount(),
      created_at: new Date().toISOString(),
    }

    try {
      if (!supabase) throw new Error(supabaseConfigError || 'Supabase unavailable')
      const { data: existingRemote, error: lookupError } = await supabase
        .from('show_up_checkins')
        .select('user_id')
        .eq('room_name', roomName)
        .eq('user_id', profile.id)
        .maybeSingle()
      if (lookupError) throw lookupError
      if (existingRemote) {
        rememberJoinedRoom()
        return
      }
      await supabase.from('show_up_checkins').upsert(payload, { onConflict: 'room_name,user_id' })
    } catch (nextError) {
      console.error('Show Up membership fallback', nextError)
      upsertLocalMember(roomName, payload)
    }
    rememberJoinedRoom()
  }

  async function handleJoinRoom(roomName) {
    const joined = safeArray(safeRead(getJoinedRoomsKey(profile.id), []))[0] || ''
    const roomCount = roomCounts[roomName] || 0
    if (joined && joined !== roomName) {
      setBottomToast(`You're already in a room. Leave it first to join another.`)
      return
    }
    setError('')
    setLoading(true)
    await ensureRoomMembership(roomName)
    setSelectedRoom(roomName)
    setActiveTab('live')
    safeWrite(getActiveRoomStorageKey(profile.id), roomName)
    setToast('')
    await postWeeklyPulseIfNeeded(roomName)
    setLoading(false)
  }

  async function handleCheckIn() {
    if (!selectedRoom || checkedIn) return
    const nowIso = new Date().toISOString()
    const patch = {
      room_name: selectedRoom,
      user_id: profile.id,
      display_name: profile.name,
      initials: profile.initials,
      checked_in: true,
      check_in_time: nowIso,
      task_done: false,
      task_done_time: '',
      streak_count: currentMember?.streak_count || getCurrentStreakCount(),
    }
    setCheckedIn(true)
    setTaskDone(false)
    setDoneTime('')
    setStoredActiveRoom(selectedRoom)
    writePresence(selectedRoom, profile.id, 'active')
    setPresenceTick(current => current + 1)
    addRoomActivity(selectedRoom, {
      type: 'checkin',
      userId: profile.id,
      displayName: profile.name,
      date: getTodayKey(),
      time: new Date(nowIso).toTimeString().slice(0, 5),
    })
    setMembers(current => (
      current.some(member => member.user_id === profile.id)
        ? current.map(member => (member.user_id === profile.id ? { ...member, ...patch } : member))
        : [patch, ...current]
    ))
    upsertLocalMember(selectedRoom, patch)

    await createRoomActivityPost(`${profile.name} just showed up 🙌`, { postStyle: 'activity' })

    try {
      if (!supabase) throw new Error(supabaseConfigError || 'Supabase unavailable')
      const { error: upsertError } = await supabase.from('show_up_checkins').upsert(patch, { onConflict: 'room_name,user_id' })
      if (upsertError) throw upsertError
      await loadRoomCounts(profile)
    } catch (nextError) {
      console.error('Show Up check-in failed', nextError)
    }
  }

  function handleJoinWaitlist(roomName) {
    const current = safeArray(safeRead(getWaitlistStorageKey(roomName), []))
    if (current.some(item => item.user_id === profile.id)) {
      setToast(`You're already on the waitlist for ${roomName}.`)
      return
    }
    safeWrite(getWaitlistStorageKey(roomName), [
      ...current,
      { user_id: profile.id, display_name: profile.name, joined_at: new Date().toISOString() },
    ])
    setToast(`You're on the waitlist for ${roomName}.`)
  }

  function handleLeaveForNow() {
    if (selectedRoom) {
      setStoredActiveRoom(selectedRoom)
      writePresence(selectedRoom, profile.id, 'inactive')
      setPresenceTick(current => current + 1)
    }
    setExitPromptOpen(false)
    setSelectedRoom(null)
    setToast(selectedRoom ? `You're still checked in — come back to mark done.` : '')
  }

  function handleBackPress() {
    if (!selectedRoom) return
    setExitPromptOpen(true)
  }

  async function handleExitRoom() {
    if (!selectedRoom) return
    const roomName = selectedRoom
    try {
      if (!supabase) throw new Error(supabaseConfigError || 'Supabase unavailable')
      await supabase
        .from('show_up_checkins')
        .delete()
        .eq('room_name', roomName)
        .eq('user_id', profile.id)
    } catch (nextError) {
      console.error('Show Up exit room fallback', nextError)
    }

    clearPresence(roomName, profile.id)
    setStoredActiveRoom('')
    const current = safeRead(getMockMemberStorageKey(roomName), [])
    if (Array.isArray(current)) {
      persistMockMembers(getMockMemberStorageKey(roomName), current.filter(member => member.user_id !== profile.id))
    }
    safeWrite(getJoinedRoomsKey(profile.id), [])
    safeRemove(getActiveRoomStorageKey(profile.id))
    setMembers([])
    setCheckedIn(false)
    setTaskDone(false)
    setDoneTime('')
    setExitPromptOpen(false)
    setSelectedRoom(null)
    loadRoomCountsFromLocal(profile)
  }

  async function handleMarkDone() {
    if (!selectedRoom || !checkedIn || taskDone || doneBusy) return
    const nowIso = new Date().toISOString()
    const roomName = selectedRoom
    const lastDoneDate = localStorage.getItem(getLastDoneDateStorageKey(roomName, profile.id))
    if (lastDoneDate === getTodayKey()) return
    const nextStreakCount = incrementCurrentStreak()
    const donePatch = {
      room_name: roomName,
      user_id: profile.id,
      display_name: profile.name,
      initials: profile.initials,
      checked_in: true,
      check_in_time: currentMember?.check_in_time || nowIso,
      task_done: true,
      task_done_time: nowIso,
      streak_count: nextStreakCount,
    }

    setDoneBusy(true)
    setTaskDone(true)
    setDoneTime(nowIso)
    setToast('')
    setStoredActiveRoom('')
    safeWrite(getLastDoneDateStorageKey(roomName, profile.id), getTodayKey())
    addRoomActivity(roomName, {
      type: 'done',
      userId: profile.id,
      displayName: profile.name,
      date: getTodayKey(),
      time: new Date(nowIso).toTimeString().slice(0, 5),
    })
    const nextMembers = members.some(member => member.user_id === profile.id)
      ? members.map(member => (member.user_id === profile.id ? { ...member, ...donePatch } : member))
      : [donePatch, ...members]
    setMembers(nextMembers)
    upsertLocalMember(roomName, donePatch)
    const nextRoomStreak = updateRoomStreak(roomName)
    setRoomStreak(nextRoomStreak)

    try {
      if (!supabase) throw new Error(supabaseConfigError || 'Supabase unavailable')
      const { error: doneError } = await supabase
        .from('show_up_checkins')
        .upsert({ ...donePatch }, { onConflict: 'room_name,user_id' })
      if (doneError) throw doneError
      await loadRoomCounts(profile)
    } catch (nextError) {
      console.error('Show Up mark done failed', nextError)
    } finally {
      setDoneBusy(false)
    }

    const completedMembers = nextMembers.filter(member => member.task_done).length
    await createRoomActivityPost(`${profile.name} locked in their task ✅  (${completedMembers} done today)`, { postStyle: 'activity' })
    if ([7, 14, 21, 30, 60, 90].includes(nextStreakCount)) {
      await createRoomActivityPost(`${profile.name} hit a ${nextStreakCount}-day streak 🔥`, { postStyle: 'activity' })
    }
    await postSundayRecapIfNeeded(roomName, nextRoomStreak, nextMembers)
    await postSilentAccountability(roomName, nextMembers)
    window.setTimeout(() => {
      setActiveTab('feed')
      setProgressToast('Nice work. Post a progress photo.')
    }, 1500)
  }

  function closeExitPrompt() {
    setExitPromptOpen(false)
  }

  function handlePhotoPick(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPostImage(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  function handleCommentPhotoPick(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCommentImage(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  function addFeedPost(post) {
    setFeedPosts(current => [post, ...current].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  }

  async function handleCreatePost() {
    const text = postDraft.trim()
    const imageDraft = postImage
    if (!text && !imageDraft) return
    setPostDraft('')
    setPostImage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    const uploadedImage = await uploadRoomFeedImage(imageDraft)
    const nextPost = await createFeedPost({ text, image: uploadedImage, anonymous: false })
    if (uploadedImage && nextPost?.id) {
      setCommentSheetPostId(nextPost.id)
    }
    window.requestAnimationFrame(() => {
      feedViewRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' })
      feedViewRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
    })
  }

  function handleToggleReaction(postId, reactionKey = 'like') {
    setFeedPosts(current => current.map(post => {
      if (post.id !== postId) return post
      const nextReactions = { ...(post.reactions || {}) }
      nextReactions[reactionKey] = safeArray(post.reactions?.[reactionKey]).filter(userId => userId !== profile.id)
      const alreadyReacted = safeArray(post.reactions?.[reactionKey]).includes(profile.id)
      if (!alreadyReacted) nextReactions[reactionKey] = [...(nextReactions[reactionKey] || []), profile.id]
      return {
        ...post,
        reactions: nextReactions,
      }
    }))
  }

  function closeCommentSheet() {
    setCommentSheetPostId('')
    setCommentImage('')
    commentSheetTouchStartRef.current = null
    if (commentFileInputRef.current) commentFileInputRef.current.value = ''
  }

  function handleCommentSheetTouchStart(event) {
    commentSheetTouchStartRef.current = event.touches?.[0]?.clientY ?? null
  }

  function handleCommentSheetTouchEnd(event) {
    const startY = commentSheetTouchStartRef.current
    const endY = event.changedTouches?.[0]?.clientY
    commentSheetTouchStartRef.current = null
    if (typeof startY !== 'number' || typeof endY !== 'number') return
    if (endY - startY > 70) closeCommentSheet()
  }

  function handleStartEditPost(post) {
    setEditingPostId(post.id)
    setEditPostDraft(post.text || '')
    setOpenPostMenuId('')
  }

  function handleSavePostEdit(postId) {
    const nextText = editPostDraft.trim()
    setFeedPosts(current => current.map(post => (
      post.id === postId ? { ...post, text: nextText } : post
    )))
    setEditingPostId('')
    setEditPostDraft('')
  }

  function handleDeletePost(postId) {
    setFeedPosts(current => current.filter(post => post.id !== postId))
    setOpenPostMenuId('')
    if (editingPostId === postId) {
      setEditingPostId('')
      setEditPostDraft('')
    }
  }

  function handleAddComment(postId) {
    const draft = String(commentDrafts[postId] || '').trim()
    if (!draft) return
    setFeedPosts(current => current.map(post => {
      if (post.id !== postId) return post
      return {
        ...post,
        comments: [
          ...safeArray(post.comments),
          {
            id: uid(),
            authorId: profile.id,
            authorName: profile.name,
            authorInitials: profile.initials,
            authorAvatarUrl: profile.avatar || '',
            anonymous: false,
            text: draft,
            image: commentImage,
            createdAt: new Date().toISOString(),
            reactions: { love: [] },
            replies: [],
          },
        ],
      }
    }))
    setCommentDrafts(current => ({ ...current, [postId]: '' }))
    setCommentImage('')
    if (commentFileInputRef.current) commentFileInputRef.current.value = ''
  }

  function handleDeleteComment(postId, commentId) {
    setFeedPosts(current => current.map(post => (
      post.id === postId
        ? { ...post, comments: safeArray(post.comments).filter(comment => comment.id !== commentId) }
        : post
    )))
    setHeldCommentId(current => current === commentId ? '' : current)
  }

  function startCommentHold(commentId, isOwnComment) {
    if (!isOwnComment) return
    if (commentHoldTimerRef.current) window.clearTimeout(commentHoldTimerRef.current)
    commentHoldTimerRef.current = window.setTimeout(() => {
      setHeldCommentId(commentId)
    }, 2200)
  }

  function clearCommentHold() {
    if (commentHoldTimerRef.current) {
      window.clearTimeout(commentHoldTimerRef.current)
      commentHoldTimerRef.current = null
    }
  }

  function handleToggleCommentReaction(postId, commentId) {
    setFeedPosts(current => current.map(post => {
      if (post.id !== postId) return post
      return {
        ...post,
        comments: safeArray(post.comments).map(comment => {
          if (comment.id !== commentId) return comment
          const nextSet = new Set(safeArray(comment.reactions?.love))
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
        comments: safeArray(post.comments).map(comment => {
          if (comment.id !== commentId) return comment
          return {
            ...comment,
            replies: [
              ...safeArray(comment.replies),
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

  function openNotifySheet(member, prefill = '') {
    setSheetState({ open: true, member })
    setSelectedTemplate('')
    setNotifyText(prefill)
    setNotifyAnonymous(false)
    setNotifyPostToFeed(false)
  }

  function handleSelectTemplate(template) {
    setSelectedTemplate(template)
    setNotifyText(template)
  }

  async function handleSendNotification() {
    const text = notifyText.trim()
    if (!text || !sheetState.member) return
    const target = sheetState.member
    const notification = {
      id: uid(),
      roomName: selectedRoom,
      toUserId: target.user_id,
      toName: target.display_name,
      fromUserId: profile.id,
      fromName: notifyAnonymous ? 'Anonymous' : profile.name,
      anonymous: notifyAnonymous,
      text,
      createdAt: new Date().toISOString(),
      read: false,
    }
    const roomNudgesKey = getRoomNudgesStorageKey(selectedRoom, target.user_id)
    const saved = safeRead(getNotificationStorageKey(target.user_id), [])
    safeWrite(getNotificationStorageKey(target.user_id), [notification, ...(Array.isArray(saved) ? saved : [])].slice(0, 50))
    safeWrite(roomNudgesKey, [notification, ...safeArray(safeRead(roomNudgesKey, []))].slice(0, 30))
    addRoomActivity(selectedRoom, {
      type: 'nudge',
      userId: profile.id,
      targetUserId: target.user_id,
      displayName: profile.name,
      date: getTodayKey(),
      time: new Date().toTimeString().slice(0, 5),
    })
    window.dispatchEvent(new CustomEvent('phasr-showup-notification', { detail: notification }))
    try {
      if (supabase) {
        await supabase.from('room_nudges').insert({
          room_id: selectedRoom,
          from_user_name: notification.fromName,
          to_user_id: target.user_id,
          message: text,
          created_at: notification.createdAt,
          seen: false,
        })
      }
    } catch (nextError) {
      console.error('Show Up nudge insert failed', nextError)
    }
    if (notifyPostToFeed) {
      const senderName = notifyAnonymous ? 'Someone' : profile.name
      await createRoomActivityPost(`${senderName} nudged ${target.display_name}: ${text}`)
    }
    setSheetState({ open: false, member: null })
    setSelectedTemplate('')
    setNotifyText('')
    setNotifyAnonymous(false)
    setNotifyPostToFeed(false)
  }

  async function handleRoomAction(type, targetUserId, targetName) {
    const emojiMap = { cheer: '🎉', nudge: '👋', taunt: '⚔️' }
    const labelMap = { cheer: 'cheered on', nudge: 'nudged', taunt: 'taunted' }
    const emoji = emojiMap[type] || '👋'
    const label = labelMap[type] || 'nudged'
    const notification = {
      id: uid(),
      roomName: selectedRoom,
      toUserId: targetUserId,
      toName: targetName,
      fromUserId: profile.id,
      fromName: profile.name,
      anonymous: false,
      text: `${profile.name} ${label} you ${emoji}`,
      createdAt: new Date().toISOString(),
      read: false,
      type,
    }
    window.dispatchEvent(new CustomEvent('phasr-showup-notification', { detail: notification }))
    try {
      if (supabase) {
        await supabase.from('room_nudges').insert({
          room_id: selectedRoom,
          from_user_name: profile.name,
          to_user_id: targetUserId,
          message: notification.text,
          created_at: notification.createdAt,
          seen: false,
          type,
        })
      }
    } catch {}
    await createRoomActivityPost(`${profile.name} ${label} ${targetName} ${emoji}`)
  }

  function handleCreateRoomStart() {
    if (!createRoomUnlocked) {
      setCreateRoomLockedOpen(true)
      return
    }
    setCreateRoomModalOpen(true)
  }

  function handleSaveCreatedRoom() {
    const trimmedName = String(createRoomName || '').trim()
    if (!trimmedName) return
    const current = safeArray(safeRead(getCreatedRoomsKey(), []))
    safeWrite(getCreatedRoomsKey(), [
      {
        id: `custom-${normalize(trimmedName)}-${uid()}`,
        name: trimmedName,
        focusAreaId: createFocusAreaId,
        created_by: profile.id,
        created_at: new Date().toISOString(),
      },
      ...current,
    ])
    setCreateRoomName('')
    setCreateFocusAreaId(ROOM_DEFINITIONS[0].id)
    setCreateRoomModalOpen(false)
    setBottomToast('Room request saved.')
  }

  const realMembers = useMemo(() => members.filter(member => !isPlaceholderMember(member)), [members])
  const currentMember = useMemo(() => members.find(member => member.user_id === profile.id) || null, [members, profile.id])
  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  const liveMembers = useMemo(() => realMembers, [realMembers])
  const visiblePosts = useMemo(() => (
    safeArray(feedPosts)
      .map(post => ({
        ...post,
        comments: dedupeByIdOrTimestamp(safeArray(post?.comments)).map(comment => ({
          ...comment,
          replies: dedupeByIdOrTimestamp(safeArray(comment?.replies)),
        })),
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  ), [feedPosts])
  const commentSheetPost = useMemo(() => visiblePosts.find(post => post.id === commentSheetPostId) || null, [visiblePosts, commentSheetPostId])
  const commentDraft = commentSheetPost ? String(commentDrafts[commentSheetPost.id] || '') : ''
  const showMentionSuggestions = /(^|\s)@\w*$/.test(commentDraft)
  const rankedMembers = useMemo(() => {
    return [...realMembers]
      .filter(member => !isPlaceholderMember(member) && member.display_name && member.display_name !== 'User')
      .map(member => ({
        ...member,
        streakValue: member.user_id === profile.id ? getCurrentStreakCount() : Number(member?.streak_count || 0),
      }))
      .sort((a, b) => (
        b.streakValue - a.streakValue ||
        String(a.display_name || '').localeCompare(String(b.display_name || ''))
      ))
  }, [activeTab, realMembers, profile.id])
  const roomRoles = useMemo(() => computeRoomRoles(realMembers, selectedRoom), [realMembers, selectedRoom, feedPosts])
  const topRoleFor = member => roomRoles[member.user_id]?.[0] || ''
  const joinedRoomMember = useMemo(() => {
    if (!joinedRoomName) return null
    return safeArray(safeRead(getMockMemberStorageKey(joinedRoomName), [])).find(member => member.user_id === profile.id) || null
  }, [joinedRoomName, profile.id, selectedRoom])
  const createRoomUnlocked = useMemo(() => {
    if (getCurrentStreakCount() >= 7) return true
    const joinedAt = joinedRoomMember?.joined_at || joinedRoomMember?.created_at || ''
    if (!joinedAt) return false
    return (Date.now() - new Date(joinedAt).getTime()) >= 7 * 24 * 60 * 60 * 1000
  }, [joinedRoomMember])
  const showPostMentionSuggestions = /(^|\s)@\w*$/.test(postDraft)
  const roomBannerText = !selectedRoom && joinedRoomName
    ? `You're in ${joinedRoomName} — tap Enter to continue.`
    : toast

  useEffect(() => {
    if (!selectedRoom) return
    safeWrite(getRanksStorageKey(selectedRoom), rankedMembers)
  }, [rankedMembers, selectedRoom])

  useEffect(() => {
    if (!selectedRoom || !supabase) return
    supabase.from('sub_rooms').select('*').eq('parent_room_name', selectedRoom).order('created_at').then(({ data }) => {
      if (data) setSubRooms(data)
    })
  }, [selectedRoom])

  useEffect(() => {
    if (!dmSheetMember) return
    const otherId = dmSheetMember.user_id
    const myId = profile.id
    const fallback = loadDmMessages(myId, otherId)
    setDmMessages(fallback)
    if (!supabase) return
    const sortedIds = [myId, otherId].sort()
    supabase
      .from('direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`)
      .order('created_at')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setDmMessages(data.map(row => ({ from: row.sender_id, fromName: row.sender_name || '', text: row.message, createdAt: row.created_at, id: row.id })))
        }
        supabase.from('direct_messages').update({ seen: true }).eq('receiver_id', myId).eq('sender_id', otherId).eq('seen', false).then(() => {})
      })
    const channel = supabase.channel(`dm_${sortedIds.join('_')}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, payload => {
        const row = payload.new
        if ((row.sender_id === myId && row.receiver_id === otherId) || (row.sender_id === otherId && row.receiver_id === myId)) {
          setDmMessages(prev => [...prev, { from: row.sender_id, fromName: row.sender_name || '', text: row.message, createdAt: row.created_at, id: row.id }])
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [dmSheetMember])

  async function handleCreateSubRoom() {
    if (!subRoomName.trim()) return
    const row = {
      parent_room_name: selectedRoom,
      name: subRoomName.trim(),
      description: subRoomDesc.trim(),
      creator_id: profile.id,
      member_limit: Number(subRoomLimit) || 20,
      is_paid: subRoomPaid,
      price: subRoomPaid && subRoomPrice ? parseFloat(subRoomPrice) : null,
    }
    if (supabase) {
      const { data, error } = await supabase.from('sub_rooms').insert(row).select().single()
      if (!error && data) setSubRooms(prev => [...prev, data])
    } else {
      setSubRooms(prev => [...prev, { ...row, id: uid(), created_at: new Date().toISOString() }])
    }
    setSubRoomName(''); setSubRoomDesc(''); setSubRoomLimit(20); setSubRoomPaid(false); setSubRoomPrice('')
    setCreateSubRoomOpen(false)
  }

  if (!selectedRoom) {
    return (
      <div
        className="showup-root"
        style={{
          background: 'linear-gradient(180deg,#fff8fb 0%,#fff2f7 100%)',
          color: '#4d3142',
          minHeight: isMobile ? 'auto' : 'calc(100vh - 56px)',
        }}
      >
        <style>{SHOW_UP_STYLES}</style>
        {nudgeToast ? (
          <div className="showup-toast-stack" role="status" aria-live="polite">
            <div
              className="showup-nudge-toast"
              onClick={() => setNudgeToast(null)}
              role="button"
              tabIndex={0}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') setNudgeToast(null)
              }}
            >
              <div className="showup-avatar">{nudgeToast.anonymous ? 'AN' : buildInitials(nudgeToast.fromName || 'Someone')}</div>
              <div className="showup-nudge-toast-text">
                <p className="showup-nudge-toast-name">{nudgeToast.anonymous ? 'Someone' : nudgeToast.fromName || 'Someone'}</p>
                <p className="showup-nudge-toast-message">{nudgeToast.text}</p>
              </div>
            </div>
          </div>
        ) : null}
        {bottomToast ? (
          <div className="showup-bottom-toast" role="status" aria-live="polite">
            {bottomToast}
          </div>
        ) : null}
        <div
          className="showup-shell"
          style={{
            width: '100%',
            maxWidth: isMobile ? '100%' : 1180,
            paddingTop: 18,
            paddingBottom: isMobile ? 0 : 36,
            minHeight: 'auto',
            flex: '0 0 auto',
            alignSelf: 'stretch',
          }}
        >
          {roomBannerText ? <div className="showup-room-inline-banner">{roomBannerText}</div> : null}
          <div
            className="showup-list-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '8px 2px 18px',
              width: '100%',
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
            <button type="button" className="showup-create-link" onClick={handleCreateRoomStart}>
              + Create room
            </button>
          </div>

          <div
            className="showup-list-panel"
            style={{
              width: '100%',
              maxWidth: '100%',
              border: '1px solid rgba(242,196,208,0.95)',
              borderRadius: 16,
              overflow: 'hidden',
              background: '#fff',
              boxShadow: 'none',
            }}
          >
            {rooms.map((room, index) => {
              const joined = roomCounts[room.name] || 0
              const isJoined = joinedRoomName === room.name
              const blockedByAnotherRoom = Boolean(joinedRoomName && joinedRoomName !== room.name)
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
                    {preferredRoomName === room.name ? <p className="showup-list-meta" style={{ margin: 0, color: '#f45f92', fontWeight: 800 }}>Your focus area</p> : null}
                    <p className="showup-list-meta" style={{ margin: 0, fontSize: 11, color: '#b29cab' }}>
                      {joined > 0 ? `${joined} member${joined === 1 ? '' : 's'} · Open` : 'Open · Be the first'}
                    </p>
                  </div>
                  <div className="showup-list-action" style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (isJoined) {
                          setSelectedRoom(room.name)
                          setActiveTab('live')
                          return
                        }
                        if (blockedByAnotherRoom) {
                          setBottomToast(`You're already in a room. Leave it first to join another.`)
                          return
                        }
                        handleJoinRoom(room.name)
                      }}
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
                        opacity: 1,
                      }}
                    >
                      {isJoined ? (
                        <span className="showup-list-state" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Check size={14} strokeWidth={2.5} color="#b5adb2" />
                          <span>Enter</span>
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

          {createRoomLockedOpen ? (
            <div className="showup-exit-backdrop" onClick={() => setCreateRoomLockedOpen(false)}>
              <div className="showup-exit-modal" onClick={event => event.stopPropagation()}>
                <h2 className="showup-exit-title">Create your own room</h2>
                <p className="showup-sheet-subtitle" style={{ fontSize: 14, lineHeight: 1.6 }}>
                  You'll unlock this when you've been consistent for 7 days. Keep showing up.
                </p>
                <button type="button" className="showup-exit-cancel" onClick={() => setCreateRoomLockedOpen(false)}>Close</button>
              </div>
            </div>
          ) : null}

          {createRoomModalOpen ? (
            <div className="showup-exit-backdrop" onClick={() => setCreateRoomModalOpen(false)}>
              <div className="showup-exit-modal" onClick={event => event.stopPropagation()}>
                <h2 className="showup-exit-title">Create your own room</h2>
                <div className="showup-create-form" style={{ marginBottom: 0 }}>
                  <label className="showup-field">
                    <span className="showup-field-label">Room name</span>
                    <input
                      className="showup-input"
                      value={createRoomName}
                      onChange={event => setCreateRoomName(event.target.value)}
                      placeholder="Enter room name"
                    />
                  </label>
                  <label className="showup-field">
                    <span className="showup-field-label">Focus area</span>
                    <select className="showup-select" value={createFocusAreaId} onChange={event => setCreateFocusAreaId(event.target.value)}>
                      {ROOM_DEFINITIONS.map(room => (
                        <option key={room.id} value={room.id}>{room.pillar}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="showup-exit-options" style={{ marginTop: 12 }}>
                  <button type="button" className="showup-exit-option" style={{ background: '#f95f85', borderColor: '#f95f85', color: '#fff' }} onClick={handleSaveCreatedRoom}>
                    <strong>Create room</strong>
                  </button>
                  <button type="button" className="showup-exit-cancel" onClick={() => setCreateRoomModalOpen(false)}>Close</button>
                </div>
              </div>
            </div>
          ) : null}

          {createSubRoomOpen ? (
            <div className="showup-exit-backdrop" onClick={() => setCreateSubRoomOpen(false)}>
              <div className="showup-exit-modal" onClick={e => e.stopPropagation()} style={{ gap: 10 }}>
                <h2 className="showup-exit-title">Create Sub-room</h2>
                <div style={{ display: 'grid', gap: 10 }}>
                  <input className="showup-input" value={subRoomName} onChange={e => setSubRoomName(e.target.value)} placeholder="Sub-room name" />
                  <textarea className="showup-comment-input" value={subRoomDesc} onChange={e => setSubRoomDesc(e.target.value)} placeholder="Description (optional)" rows={2} style={{ resize: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#9a7088', fontWeight: 700, minWidth: 80 }}>Member limit</span>
                    <input type="number" className="showup-input" value={subRoomLimit} onChange={e => setSubRoomLimit(e.target.value)} min={2} max={100} style={{ width: 70 }} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#4d3142', fontWeight: 600 }}>
                    <input type="checkbox" checked={subRoomPaid} onChange={e => setSubRoomPaid(e.target.checked)} />
                    Paid sub-room
                  </label>
                  {subRoomPaid ? <input className="showup-input" type="number" value={subRoomPrice} onChange={e => setSubRoomPrice(e.target.value)} placeholder="Price (e.g. 9.99)" min={0} step={0.01} /> : null}
                </div>
                <button type="button" className="showup-exit-option" style={{ background: '#f95f85', borderColor: '#f95f85', color: '#fff', marginTop: 4 }} onClick={handleCreateSubRoom}>
                  <strong>Create sub-room</strong>
                </button>
                <button type="button" className="showup-exit-cancel" onClick={() => setCreateSubRoomOpen(false)}>Cancel</button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="showup-root" style={{ '--bg': '#fff8f9', background: '#fff8f9', width: '100%', overflowX: 'hidden' }}>
      <style>{SHOW_UP_STYLES}</style>
      {nudgeToast ? (
        <div className="showup-toast-stack" role="status" aria-live="polite">
          <div
            className="showup-nudge-toast"
            onClick={() => setNudgeToast(null)}
            role="button"
            tabIndex={0}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') setNudgeToast(null)
            }}
          >
            <div className="showup-avatar">{nudgeToast.anonymous ? 'AN' : buildInitials(nudgeToast.fromName || 'Someone')}</div>
            <div className="showup-nudge-toast-text">
              <p className="showup-nudge-toast-name">{nudgeToast.anonymous ? 'Someone' : nudgeToast.fromName || 'Someone'} nudged you</p>
              <p className="showup-nudge-toast-message">"{nudgeToast.text}"</p>
            </div>
          </div>
        </div>
      ) : null}
      {bottomToast ? (
        <div className="showup-bottom-toast" role="status" aria-live="polite">
          {bottomToast}
        </div>
      ) : null}

      <div className="showup-shell" style={{ '--bg': '#fff8f9', background: '#fff8f9', width: '100%', maxWidth: 1180, minWidth: 0, overflowX: 'hidden' }}>
        {pulseBanner ? <div className="showup-sync-notice" style={{ marginBottom: 10 }}>{pulseBanner}</div> : null}
        <div className="showup-sticky-header">
          <div className="showup-topbar">
            <button type="button" className="showup-header-btn" onClick={handleBackPress}>{'\u2190'}</button>
            <h1 className="showup-room-title" style={{ textAlign: 'left' }}>{formatRoomTitle(selectedRoom)}</h1>
          </div>
          <div className="showup-checkin-actions">
            <button
              type="button"
              className={`showup-checkin-btn ${checkedIn ? 'is-complete' : ''}`}
              onClick={handleCheckIn}
              disabled={checkedIn}
            >
              {checkedIn && currentMember?.check_in_time ? `Checked in ${formatTime(currentMember.check_in_time)}` : 'Check In'}
            </button>
            <button
              type="button"
              className={`showup-done-btn ${taskDone ? 'is-complete' : ''}`}
              onClick={handleMarkDone}
              disabled={!checkedIn || taskDone || doneBusy}
            >
              {taskDone ? 'Done ✓' : (doneBusy ? 'Saving...' : 'Mark Done')}
            </button>
          </div>
        </div>

        <div className="showup-tabs">
          {[
            { key: 'live', label: 'Live' },
            { key: 'feed', label: 'Feed' },
            { key: 'ranks', label: 'Stacks' },
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
          <div style={{ display: 'grid', gap: 16 }}>
            <div className="showup-member-grid">
              {liveMembers.length === 0 ? (
                <div className="showup-empty">No one is in this room yet.</div>
              ) : null}
              {liveMembers.map(member => {
                const presenceStatus = getPresenceStatus(selectedRoom, member)
                const role = topRoleFor(member)
                const isMe = member.user_id === profile.id
                const memberAvatarUrl = isMe ? profile.avatar : (member.avatar_url || member.avatar || '')
                const avatarInitials = isMe ? profile.initials : (member.initials || buildInitials(member.display_name))
                const aboutText = isMe ? profile.about : (member.about || '')
                return (
                  <div
                    key={member.user_id}
                    className="showup-member-card"
                    style={{
                      background: member.task_done ? 'rgba(47,182,109,0.10)' : (presenceStatus === 'active' ? 'rgba(255,255,255,0.9)' : 'transparent'),
                      borderColor: member.task_done ? 'rgba(47,182,109,0.28)' : 'rgba(249,95,133,0.18)',
                    }}
                    onClick={() => {
                      if (isMe) {
                        setProfileAvatarDraft(profile.avatar || '')
                        setProfileAboutDraft(profile.about || '')
                        setProfileEditOpen(true)
                      } else {
                        setH2hMember(member)
                      }
                    }}
                  >
                    <div className="showup-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                      {memberAvatarUrl
                        ? <img src={memberAvatarUrl} alt={member.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                        : avatarInitials
                      }
                    </div>
                    <div style={{ minWidth: 0, maxWidth: '100%' }}>
                      <p className="showup-member-name">{isMe ? 'You' : member.display_name}</p>
                      {aboutText ? (
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#b98097', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{aboutText}</p>
                      ) : role ? (
                        <p className={`showup-role-badge ${role === 'Room Leader' ? 'is-leader' : ''}`}>{role}</p>
                      ) : isMe ? (
                        <p style={{ margin: '3px 0 0', fontSize: 10, color: '#f95f85', fontWeight: 700 }}>Tap to edit</p>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ borderTop: '1px solid rgba(249,95,133,0.12)', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#9a7088', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Sub-rooms</p>
                <button
                  type="button"
                  onClick={() => setCreateSubRoomOpen(true)}
                  style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(249,95,133,0.3)', background: 'rgba(249,95,133,0.06)', color: '#f95f85', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  + Create
                </button>
              </div>
              {subRooms.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: '#b98097', textAlign: 'center', padding: '12px 0' }}>No sub-rooms yet. Create one for a focused group.</p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {subRooms.map(sr => (
                    <button
                      key={sr.id}
                      type="button"
                      onClick={() => setActiveSubRoom(activeSubRoom?.id === sr.id ? null : sr)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, border: `1px solid ${activeSubRoom?.id === sr.id ? 'rgba(249,95,133,0.4)' : 'rgba(249,95,133,0.18)'}`, background: activeSubRoom?.id === sr.id ? 'rgba(249,95,133,0.08)' : 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: '#4d3142' }}>{sr.name}</p>
                        {sr.description ? <p style={{ margin: '2px 0 0', fontSize: 11, color: '#b98097', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sr.description}</p> : null}
                      </div>
                      {sr.is_paid ? <span style={{ fontSize: 11, fontWeight: 700, color: '#f97bb3', background: 'rgba(249,95,133,0.1)', borderRadius: 8, padding: '2px 7px' }}>Paid{sr.price ? ` $${sr.price}` : ''}</span> : null}
                      <span style={{ fontSize: 11, color: '#b98097' }}>👥 {sr.member_limit}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === 'feed' ? (
          <div className="showup-feed-view" ref={feedViewRef}>
            {progressToast ? (
              <div className="showup-progress-toast" role="status" aria-live="polite">
                {progressToast}
              </div>
            ) : null}
            <div className="showup-compose-card">
              <div className="showup-compose-top">
                <div className="showup-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                  {profile.avatar
                    ? <img src={profile.avatar} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                    : profile.initials}
                </div>
                <input
                  className="showup-compose-input"
                  value={postDraft}
                  onChange={event => setPostDraft(event.target.value)}
                  placeholder="Share what you are working on..."
                />
              </div>
              {showPostMentionSuggestions ? (
                <div className="showup-mention-list">
                  {realMembers.slice(0, 6).map(member => (
                    <button
                      key={member.user_id}
                      type="button"
                      onClick={() => setPostDraft(`${postDraft.replace(/@\w*$/, '')}@${String(member.display_name || '').split(' ')[0]} `)}
                    >
                      @{String(member.display_name || '').split(' ')[0]}
                    </button>
                  ))}
                </div>
              ) : null}
              {postImage ? (
                <div className="showup-feed-media-wrapper">
                  {getMediaKind(postImage) === 'video'
                    ? <video className="showup-feed-image" src={postImage} controls playsInline onClick={event => { event.stopPropagation(); setLightboxMedia({ url: postImage, kind: 'video' }) }} />
                    : <img className="showup-feed-image" src={postImage} alt="Upload preview" loading="lazy" onClick={event => { event.stopPropagation(); setLightboxMedia({ url: postImage, kind: 'image' }) }} />}
                </div>
              ) : null}
              <div className="showup-compose-actions">
                <button type="button" className="showup-photo-btn" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon size={15} strokeWidth={2.2} />
                  <span>Photo</span>
                </button>
                <button type="button" className="showup-post-btn" onClick={handleCreatePost} disabled={!postDraft.trim() && !postImage}>
                  <Send size={15} strokeWidth={2.2} />
                  <span>Post</span>
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" className="showup-hidden-input" onChange={handlePhotoPick} />
            </div>

            {visiblePosts.length === 0 ? (
              <div className="showup-empty">No posts yet. Be the first to share.</div>
            ) : (
              visiblePosts.map(post => {
                const likeCount = safeArray(post.reactions?.like).length
                const likedByMe = safeArray(post.reactions?.like).includes(profile.id)
                const targetMember = post.targetUserId ? realMembers.find(member => member.user_id === post.targetUserId) : null
                const feedClass = [
                  'showup-feed-card',
                  post.anonymous ? 'is-anonymous' : '',
                  post.postStyle === 'activity' ? 'is-activity' : (post.system ? 'is-sage' : ''),
                  post.postStyle === 'pulse' ? 'is-pulse' : '',
                  post.postStyle === 'recap' ? 'is-recap' : '',
                ].filter(Boolean).join(' ')
                return (
                <div
                  key={post.id}
                  className={feedClass}
                  onClick={() => {
                    if (!targetMember) return
                    openNotifySheet(targetMember, `Room's here when you're ready. One small step still counts.`)
                  }}
                  style={{ cursor: targetMember ? 'pointer' : undefined }}
                >
                  <div className="showup-feed-header">
                    <div className="showup-feed-author">
                      <div className="showup-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                        {!post.anonymous && post.authorAvatarUrl
                          ? <img src={post.authorAvatarUrl} alt={post.authorName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                          : (post.anonymous ? '\u{1F464}' : post.authorInitials || buildInitials(post.authorName))
                        }
                      </div>
                      <div className="showup-feed-header-main">
                        <p className="showup-feed-name">{post.anonymous ? 'Anonymous \u00B7 Room' : post.authorName}</p>
                        <p className="showup-feed-time">{formatTimestamp(post.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  {editingPostId === post.id ? (
                    <div className="showup-post-edit">
                      <input
                        className="showup-comment-input"
                        value={editPostDraft}
                        onChange={event => setEditPostDraft(event.target.value)}
                        onKeyDown={event => {
                          if (event.key === 'Enter') handleSavePostEdit(post.id)
                        }}
                        autoFocus
                      />
                      <div className="showup-post-edit-actions">
                        <button type="button" aria-label="Close edit" onClick={() => { setEditingPostId(''); setEditPostDraft('') }}>×</button>
                        <button type="button" onClick={() => handleSavePostEdit(post.id)}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <p className="showup-feed-text">{post.text}</p>
                  )}
                  {post.image ? (
                    <div className="showup-feed-media-wrapper">
                      {getMediaKind(post.image) === 'video'
                        ? <video className="showup-feed-image" src={post.image} controls playsInline onClick={event => { event.stopPropagation(); setLightboxMedia({ url: post.image, kind: 'video' }) }} />
                        : <img className="showup-feed-image" src={post.image} alt="Feed upload" loading="lazy" onClick={event => { event.stopPropagation(); setLightboxMedia({ url: post.image, kind: 'image' }) }} />}
                    </div>
                  ) : null}
                  <div className="showup-feed-reactions">
                    <button
                      type="button"
                      className={`showup-reaction-chip ${likedByMe ? 'is-active' : ''}`}
                      onClick={event => {
                        event.stopPropagation()
                        handleToggleReaction(post.id, 'like')
                      }}
                      aria-label={likedByMe ? 'Unlike post' : 'Like post'}
                    >
                      <ThumbsUp size={15} strokeWidth={2.2} />
                      <span>{likeCount}</span>
                    </button>
                    <button
                      type="button"
                      className="showup-comment-toggle"
                      onClick={event => {
                        event.stopPropagation()
                        setCommentSheetPostId(post.id)
                      }}
                    >
                      <MessageCircle size={14} strokeWidth={2.1} />
                      <span>{safeArray(post.comments).length}</span>
                    </button>
                  </div>
                  {!post.system && !post.postStyle && post.authorId !== profile.id && post.authorId ? (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      {[{ type: 'cheer', label: '🎉 Cheer' }, { type: 'nudge', label: '👋 Nudge' }, { type: 'taunt', label: '⚔️ Taunt' }].map(action => (
                        <button
                          key={action.type}
                          type="button"
                          onClick={event => {
                            event.stopPropagation()
                            handleRoomAction(action.type, post.authorId, post.authorName)
                          }}
                          style={{
                            flex: 1, padding: '5px 0', borderRadius: 20,
                            border: '1px solid rgba(249,95,133,0.22)',
                            background: 'rgba(249,95,133,0.06)',
                            color: '#c84f73', fontSize: 12, fontWeight: 700,
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                )
              })
            )}
          </div>
        ) : null}

        {activeTab === 'ranks' ? (
          <div className="showup-ranks-view">
            {rankedMembers.length === 0 ? (
              <div className="showup-empty">No members ranked yet.</div>
            ) : rankedMembers.map((member, index) => {
              const roles = roomRoles[member.user_id] || []
              const topRole = roles[0] || ''
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null
              const podiumStyle = index === 0
                ? { background: 'linear-gradient(135deg,#fffae6,#fff3c4)', borderColor: 'rgba(220,170,30,0.35)' }
                : index === 1
                ? { background: 'linear-gradient(135deg,#f4f4f6,#eaeaee)', borderColor: 'rgba(180,180,190,0.40)' }
                : index === 2
                ? { background: 'linear-gradient(135deg,#fff2ec,#ffe8d8)', borderColor: 'rgba(200,130,80,0.30)' }
                : {}
              const isMe = member.user_id === profile.id
              const stackAvatarUrl = isMe ? profile.avatar : (member.avatar_url || member.avatar || '')
              const stackInitials = isMe ? profile.initials : (member.initials || buildInitials(member.display_name))
              return (
                <div
                  key={member.user_id}
                  className={`showup-rank-row ${index === 0 ? 'is-leader' : ''}`}
                  style={{ ...podiumStyle, cursor: isMe ? undefined : 'pointer' }}
                  onClick={() => { if (!isMe) setH2hMember(member) }}
                >
                  <div className={`showup-rank-number ${index === 0 ? 'is-leader' : 'is-muted'}`}>
                    {medal || (index + 1)}
                  </div>
                  <div className="showup-avatar" style={{ overflow: 'hidden', padding: 0, flexShrink: 0 }}>
                    {stackAvatarUrl
                      ? <img src={stackAvatarUrl} alt={member.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                      : stackInitials}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p className="showup-rank-name">{isMe ? 'You' : member.display_name}</p>
                    <p className="showup-rank-streak">{member.streakValue > 0 ? `🔥 ${member.streakValue} day streak` : 'No streak yet'}</p>
                  </div>
                  <div className="showup-rank-score" aria-label={`${member.streakValue} day streak`} style={{ textAlign: 'center' }}>
                    <span className="showup-rank-score-value">{member.streakValue}</span>
                    <span className="showup-rank-score-label">streak</span>
                  </div>
                  {topRole ? <div className="showup-rank-badge">{topRole}</div> : <div />}
                </div>
              )
            })}
          </div>
        ) : null}
      </div>

      {exitPromptOpen ? (
        <div className="showup-exit-backdrop" onClick={() => setExitPromptOpen(false)}>
          <div className="showup-exit-modal" onClick={event => event.stopPropagation()}>
            <h2 className="showup-exit-title">Leave room?</h2>
            <div className="showup-exit-options">
              <button type="button" className="showup-exit-option" style={{ background: '#f95f85', borderColor: '#f95f85', color: '#fff' }} onClick={handleLeaveForNow}>
                <strong>Leave for now</strong>
                <span style={{ color: 'rgba(255,255,255,0.92)' }}>Your progress is saved. Come back to mark done.</span>
              </button>
              <button type="button" className="showup-exit-option" style={{ background: '#fff', borderColor: '#f95f85', color: '#c84f73' }} onClick={handleExitRoom}>
                <strong>
                  <LogOut size={15} strokeWidth={2.2} />
                  <span>Exit room</span>
                </strong>
                <span>You'll lose your spot. Someone else may take it.</span>
              </button>
            </div>
            <button type="button" className="showup-exit-cancel" aria-label="Close leave modal" onClick={closeExitPrompt}>Cancel</button>
          </div>
        </div>
      ) : null}

      {profileEditOpen ? (
        <div className="showup-sheet-backdrop" onClick={() => setProfileEditOpen(false)}>
          <div className="showup-sheet" onClick={event => event.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="showup-sheet-handle" />
            <h2 className="showup-sheet-title" style={{ fontSize: 16 }}>Your profile</h2>
            <p className="showup-sheet-subtitle">Visible to everyone in your room.</p>
            <div style={{ display: 'grid', gap: 14, padding: '4px 0 12px' }}>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#b98097', letterSpacing: '.04em' }}>AVATAR (emoji)</p>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="🙋 or leave empty"
                  value={profileAvatarDraft}
                  onChange={e => setProfileAvatarDraft(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(249,95,133,0.25)', fontSize: 20, background: '#fff8f9', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#b98097', letterSpacing: '.04em' }}>ABOUT (1 line)</p>
                <textarea
                  maxLength={80}
                  placeholder="Building something great..."
                  value={profileAboutDraft}
                  onChange={e => setProfileAboutDraft(e.target.value)}
                  rows={2}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(249,95,133,0.25)', fontSize: 13, background: '#fff8f9', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', resize: 'none' }}
                />
              </div>
              <button
                type="button"
                style={{ padding: '12px', borderRadius: 999, background: 'linear-gradient(135deg,var(--app-accent2,#f97bb3),var(--app-accent,#f95f85))', color: '#fff', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => {
                  const next = { avatar: profileAvatarDraft.trim(), about: profileAboutDraft.trim() }
                  saveProfileExtra(profile.id, next)
                  setProfile(prev => ({ ...prev, ...next }))
                  setProfileEditOpen(false)
                }}
              >
                Save profile
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {dmSheetMember ? (
        <div className="showup-sheet-backdrop" onClick={() => setDmSheetMember(null)}>
          <div className="showup-sheet" onClick={event => event.stopPropagation()} style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', maxHeight: '80dvh' }}>
            <div className="showup-sheet-handle" />
            <h2 className="showup-sheet-title" style={{ fontSize: 15 }}>
              <MessageCircle size={16} strokeWidth={2.3} />
              <span>{dmSheetMember.display_name}</span>
            </h2>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0 4px', minHeight: 80 }}>
              {dmMessages.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#b98097', fontSize: 13, margin: 'auto' }}>No messages yet. Say something.</p>
              ) : dmMessages.map((msg, i) => {
                const mine = msg.from === profile.id
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '78%', padding: '8px 12px', borderRadius: mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: mine ? 'linear-gradient(135deg,var(--app-accent2,#f97bb3),var(--app-accent,#f95f85))' : 'rgba(249,95,133,0.08)', color: mine ? '#fff' : '#4d3142', fontSize: 13, lineHeight: 1.45 }}>
                      {!mine && <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: '#b98097' }}>{msg.fromName}</p>}
                      {msg.text}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid rgba(249,95,133,0.12)' }}>
              <input
                type="text"
                value={dmDraft}
                onChange={e => setDmDraft(e.target.value)}
                onKeyDown={async e => {
                  if (e.key === 'Enter' && dmDraft.trim()) {
                    const text = dmDraft.trim()
                    setDmDraft('')
                    const msg = { from: profile.id, fromName: profile.name, text, createdAt: new Date().toISOString() }
                    if (supabase) {
                      await supabase.from('direct_messages').insert({ room_name: selectedRoom, sender_id: profile.id, sender_name: profile.name, receiver_id: dmSheetMember.user_id, message: text })
                    } else {
                      const next = saveDmMessage(profile.id, dmSheetMember.user_id, msg)
                      setDmMessages(next)
                    }
                  }
                }}
                placeholder="Type a message..."
                style={{ flex: 1, padding: '10px 12px', borderRadius: 999, border: '1px solid rgba(249,95,133,0.25)', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff8f9' }}
              />
              <button
                type="button"
                disabled={!dmDraft.trim()}
                style={{ padding: '10px 16px', borderRadius: 999, background: dmDraft.trim() ? 'linear-gradient(135deg,var(--app-accent2,#f97bb3),var(--app-accent,#f95f85))' : 'rgba(249,95,133,0.15)', color: dmDraft.trim() ? '#fff' : '#b98097', fontWeight: 800, fontSize: 13, border: 'none', cursor: dmDraft.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}
                onClick={async () => {
                  if (!dmDraft.trim()) return
                  const text = dmDraft.trim()
                  setDmDraft('')
                  const msg = { from: profile.id, fromName: profile.name, text, createdAt: new Date().toISOString() }
                  if (supabase) {
                    await supabase.from('direct_messages').insert({ room_name: selectedRoom, sender_id: profile.id, sender_name: profile.name, receiver_id: dmSheetMember.user_id, message: text })
                  } else {
                    const next = saveDmMessage(profile.id, dmSheetMember.user_id, msg)
                    setDmMessages(next)
                  }
                }}
              >
                <Send size={14} strokeWidth={2.3} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {h2hMember ? (() => {
        const them = h2hMember
        const theirAvatarUrl = them.avatar_url || them.avatar || ''
        const theirInitials = them.initials || buildInitials(them.display_name)
        const myAvatarUrl = profile.avatar || ''
        const myInitials = profile.initials
        const myStreak = liveMembers.find(m => m.user_id === profile.id)?.streak_count ?? 0
        const theirStreak = them.streak_count ?? them.streakValue ?? 0
        const myTasks = liveMembers.find(m => m.user_id === profile.id)?.total_tasks_done ?? 0
        const theirTasks = them.total_tasks_done ?? 0
        const statStyle = (mine, theirs) => ({
          fontWeight: 800, fontSize: 22,
          color: mine >= theirs ? '#2fb66d' : '#f95f85',
        })
        return (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(41,18,31,0.55)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}
            onClick={() => setH2hMember(null)}
          >
            <div
              style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 20px calc(32px + env(safe-area-inset-bottom,0px))', boxShadow: '0 -22px 58px rgba(77,49,66,0.16)', maxHeight: '88dvh', overflowY: 'auto', boxSizing: 'border-box' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(249,95,133,0.25)', margin: '0 auto 20px' }} />
              <p style={{ textAlign: 'center', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '0.85rem', color: '#b98097', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 18px' }}>Head-to-Head</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 28 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(47,182,109,0.4)', background: 'rgba(249,95,133,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: '#f95f85' }}>
                    {myAvatarUrl ? <img src={myAvatarUrl} alt="You" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : myInitials}
                  </div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: '#4d3142' }}>You</p>
                </div>
                <p style={{ margin: 0, fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: '1.1rem', color: '#f95f85' }}>VS</p>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(249,95,133,0.3)', background: 'rgba(249,95,133,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: '#f95f85' }}>
                    {theirAvatarUrl ? <img src={theirAvatarUrl} alt={them.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : theirInitials}
                  </div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: '#4d3142', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{them.display_name}</p>
                </div>
              </div>

              {[
                { label: 'Streak', mine: myStreak, theirs: theirStreak, unit: 'days' },
                { label: 'Tasks Done', mine: myTasks, theirs: theirTasks, unit: 'tasks' },
                { label: 'Best Streak', mine: myStreak, theirs: theirStreak, unit: 'days' },
              ].map(stat => (
                <div key={stat.label} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, padding: '12px 0', borderBottom: '1px solid rgba(249,95,133,0.1)' }}>
                  <p style={{ ...statStyle(stat.mine, stat.theirs), textAlign: 'right', margin: 0 }}>{stat.mine}<span style={{ fontWeight: 500, fontSize: 11, color: '#b98097', marginLeft: 3 }}>{stat.unit}</span></p>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#b98097', textAlign: 'center', minWidth: 70 }}>{stat.label}</p>
                  <p style={{ ...statStyle(stat.theirs, stat.mine), textAlign: 'left', margin: 0 }}>{stat.theirs}<span style={{ fontWeight: 500, fontSize: 11, color: '#b98097', marginLeft: 3 }}>{stat.unit}</span></p>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
                {[{ type: 'cheer', label: '🎉 Cheer' }, { type: 'nudge', label: '👋 Nudge' }, { type: 'taunt', label: '⚔️ Taunt' }].map(action => (
                  <button
                    key={action.type}
                    type="button"
                    onClick={() => { handleRoomAction(action.type, them.user_id, them.display_name); setH2hMember(null) }}
                    style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '1px solid rgba(249,95,133,0.22)', background: 'rgba(249,95,133,0.06)', color: '#c84f73', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => { const msgs = loadDmMessages(profile.id, them.user_id); setDmMessages(msgs); setDmSheetMember(them); setH2hMember(null) }}
                style={{ width: '100%', marginTop: 10, padding: '12px 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f95f85,#ff8ca8)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <MessageCircle size={14} strokeWidth={2.3} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Message {them.display_name}
              </button>
            </div>
          </div>
        )
      })() : null}

      {lightboxMedia.url ? (
        <div className="showup-lightbox" onClick={() => setLightboxMedia({ url: '', kind: '' })}>
          <button
            type="button"
            className="showup-lightbox-close"
            onClick={() => setLightboxMedia({ url: '', kind: '' })}
            aria-label={lightboxMedia.kind === 'video' ? 'Close video' : 'Close image'}
          >
            ×
          </button>
          {lightboxMedia.kind === 'video' ? (
            <video
              src={lightboxMedia.url}
              controls
              autoPlay
              playsInline
              onClick={event => event.stopPropagation()}
              style={{ maxWidth: 'min(100%, 880px)', maxHeight: '88vh', borderRadius: 20, background: '#000' }}
            />
          ) : (
            <img
              src={lightboxMedia.url}
              alt="Expanded feed upload"
              onClick={event => event.stopPropagation()}
            />
          )}
        </div>
      ) : null}

      {commentSheetPost ? (
        <div className="showup-sheet-backdrop" onClick={closeCommentSheet}>
          <div
            className={`showup-comment-sheet ${commentDraft ? 'is-expanded' : ''}`}
            onClick={event => event.stopPropagation()}
            onTouchStart={handleCommentSheetTouchStart}
            onTouchEnd={handleCommentSheetTouchEnd}
          >
            <div className="showup-sheet-handle" />
            <div className="showup-comment-sheet-list">
              {safeArray(commentSheetPost.comments).length ? dedupeByIdOrTimestamp(safeArray(commentSheetPost.comments)).map(comment => {
                const ownComment = comment.authorId === profile.id
                const replyKey = `${commentSheetPost.id}:${comment.id}`
                const replies = dedupeByIdOrTimestamp(safeArray(comment.replies))
                return (
                <div
                  key={comment.id}
                  className="showup-comment-row"
                  onMouseDown={() => startCommentHold(comment.id, ownComment)}
                  onMouseUp={clearCommentHold}
                  onMouseLeave={() => { clearCommentHold(); if (heldCommentId === comment.id) setHeldCommentId('') }}
                  onTouchStart={() => startCommentHold(comment.id, ownComment)}
                  onTouchEnd={clearCommentHold}
                >
                  <div className="showup-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                    {!comment.anonymous && comment.authorAvatarUrl
                      ? <img src={comment.authorAvatarUrl} alt={comment.authorName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                      : (comment.anonymous ? 'AN' : comment.authorInitials || buildInitials(comment.authorName))
                    }
                  </div>
                  <div className="showup-comment-bubble">
                    <p className="showup-comment-author">{comment.anonymous ? 'Anonymous · Room' : comment.authorName}</p>
                    <p className="showup-comment-text">{comment.text}</p>
                    {comment.image ? <img className="showup-comment-image-preview" src={comment.image} alt="Comment attachment" loading="lazy" /> : null}
                    <div className="showup-comment-actions">
                      <button type="button" className="showup-comment-action" onClick={() => handleToggleCommentReaction(commentSheetPost.id, comment.id)}>
                        <Heart size={12} strokeWidth={2.1} />
                        <span>{safeArray(comment.reactions?.love).length}</span>
                      </button>
                      <button
                        type="button"
                        className="showup-comment-action"
                        onClick={() => {
                          const mentionName = `@${String(comment.authorName || '').split(' ')[0]} `
                          setReplyTarget({ postId: commentSheetPost.id, commentId: comment.id })
                          setReplyDrafts(current => ({ ...current, [replyKey]: mentionName }))
                        }}
                      >
                        <Reply size={12} strokeWidth={2.1} />
                        <span>Reply</span>
                      </button>
                      {ownComment && heldCommentId === comment.id ? (
                        <button type="button" className="showup-comment-action showup-comment-delete" onClick={() => handleDeleteComment(commentSheetPost.id, comment.id)}>
                          <Trash2 size={12} strokeWidth={2.1} />
                        </button>
                      ) : null}
                    </div>
                    <div className="showup-replies">
                      {replies.map(reply => (
                        <div key={reply.id} className="showup-reply-bubble" style={{ marginLeft: 16 }}>
                          <p className="showup-comment-author">{reply.authorName}</p>
                          <p className="showup-comment-text">{reply.text}</p>
                        </div>
                      ))}
                      {replyTarget?.postId === commentSheetPost.id && replyTarget?.commentId === comment.id ? (
                        <div className="showup-comment-compose">
                          <input
                            className="showup-comment-input"
                            value={replyDrafts[replyKey] || ''}
                            onChange={event => setReplyDrafts(current => ({ ...current, [replyKey]: event.target.value }))}
                            placeholder="Reply..."
                          />
                          <button
                            type="button"
                            className="showup-comment-send"
                            onClick={() => {
                              handleAddReply(commentSheetPost.id, comment.id)
                              setReplyTarget(null)
                            }}
                          >
                            Send
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}) : (
                <div className="showup-empty">No comments yet.</div>
              )}
            </div>
            <div className="showup-comment-sheet-compose">
              {showMentionSuggestions ? (
                <div className="showup-mention-list">
                  {realMembers.slice(0, 6).map(member => (
                    <button
                      key={member.user_id}
                      type="button"
                      onClick={() => setCommentDrafts(current => ({
                        ...current,
                        [commentSheetPost.id]: `${commentDraft.replace(/@\w*$/, '')}@${String(member.display_name || '').split(' ')[0]} `,
                      }))}
                    >
                      @{String(member.display_name || '').split(' ')[0]}
                    </button>
                  ))}
                </div>
              ) : null}
              {commentImage ? <img className="showup-comment-image-preview" src={commentImage} alt="Comment upload preview" /> : null}
              <div className="showup-comment-inline">
                <div className="showup-avatar">{profile.initials}</div>
                <input
                  className="showup-comment-input"
                  value={commentDraft}
                  onChange={event => setCommentDrafts(current => ({ ...current, [commentSheetPost.id]: event.target.value }))}
                  placeholder="Add a comment..."
                />
                <button type="button" className="showup-comment-icon-btn" onClick={() => setCommentDrafts(current => ({ ...current, [commentSheetPost.id]: `${commentDraft}@` }))}>@</button>
                <button type="button" className="showup-comment-icon-btn" onClick={() => commentFileInputRef.current?.click()}>
                  <ImageIcon size={15} strokeWidth={2.2} />
                </button>
                <button type="button" className="showup-comment-round-send" onClick={() => handleAddComment(commentSheetPost.id)}>
                  <Send size={15} strokeWidth={2.4} />
                </button>
              </div>
              <input ref={commentFileInputRef} type="file" accept="image/*" className="showup-hidden-input" onChange={handleCommentPhotoPick} />
            </div>
          </div>
        </div>
      ) : null}

      {sheetState.open && sheetState.member ? (
        <div className="showup-sheet-backdrop" onClick={() => setSheetState({ open: false, member: null })}>
          <div className="showup-sheet" onClick={event => event.stopPropagation()}>
            <div className="showup-sheet-handle" />
            <h2 className="showup-sheet-title">
              <MessageCircle size={18} strokeWidth={2.3} />
              <span>Nudge {sheetState.member.display_name}</span>
            </h2>
            <p className="showup-sheet-subtitle">Send a notification. You can also post it to the room feed.</p>
            <div className="showup-sheet-list">
              {getNudgeTemplates(sheetState.member).map(template => (
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
              <span>Send anonymously. Your name will not show to this person or in the feed.</span>
            </label>
            <label className="showup-anon">
              <input type="checkbox" checked={notifyPostToFeed} onChange={event => setNotifyPostToFeed(event.target.checked)} />
              <span>Also post this nudge to the room feed.</span>
            </label>
            <div className="showup-sheet-actions">
              <button type="button" className="showup-sheet-send" onClick={handleSendNotification}>Send</button>
              <button type="button" className="showup-sheet-cancel" aria-label="Close nudge sheet" onClick={() => setSheetState({ open: false, member: null })}>×</button>
            </div>
          </div>
        </div>
      ) : null}

      {createRoomLockedOpen ? (
        <div className="showup-exit-backdrop" onClick={() => setCreateRoomLockedOpen(false)}>
          <div className="showup-exit-modal" onClick={event => event.stopPropagation()}>
            <h2 className="showup-exit-title">Create your own room</h2>
            <p className="showup-sheet-subtitle" style={{ fontSize: 14, lineHeight: 1.6 }}>
              You'll unlock this when you've been consistent for 7 days. Keep showing up.
            </p>
            <button type="button" className="showup-exit-cancel" onClick={() => setCreateRoomLockedOpen(false)}>Close</button>
          </div>
        </div>
      ) : null}

      {createRoomModalOpen ? (
        <div className="showup-exit-backdrop" onClick={() => setCreateRoomModalOpen(false)}>
          <div className="showup-exit-modal" onClick={event => event.stopPropagation()}>
            <h2 className="showup-exit-title">Create your own room</h2>
            <div className="showup-create-form" style={{ marginBottom: 0 }}>
              <label className="showup-field">
                <span className="showup-field-label">Room name</span>
                <input
                  className="showup-input"
                  value={createRoomName}
                  onChange={event => setCreateRoomName(event.target.value)}
                  placeholder="Enter room name"
                />
              </label>
              <label className="showup-field">
                <span className="showup-field-label">Focus area</span>
                <select className="showup-select" value={createFocusAreaId} onChange={event => setCreateFocusAreaId(event.target.value)}>
                  {ROOM_DEFINITIONS.map(room => (
                    <option key={room.id} value={room.id}>{room.pillar}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="showup-exit-options" style={{ marginTop: 12 }}>
              <button type="button" className="showup-exit-option" style={{ background: '#f95f85', borderColor: '#f95f85', color: '#fff' }} onClick={handleSaveCreatedRoom}>
                <strong>Create room</strong>
              </button>
              <button type="button" className="showup-exit-cancel" onClick={() => setCreateRoomModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

