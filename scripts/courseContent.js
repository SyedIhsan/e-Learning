import { escapeHtml, navigate, isCompleted, calculateProgress, getPurchasedList } from "./helpers.js";
import STATE from "./state.js";
import { COURSES } from "../data/course.js";

const toVideoEmbedUrl = (raw) => {
  const url = String(raw || "").trim().replace(/^["\']+|["\']+$/g, "");
  if (!url) return "";

  // direct video file
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return url;

  // YouTube (watch, share, shorts, embed)
  let m =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/) ||
    url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/) ||
    url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}?enablejsapi=1&rel=0`;

  // Google Drive (file/d/<id>/view or open?id=<id>)
  m = url.match(/drive\.google\.com\/file\/d\/([^\/?#]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;

  m = url.match(/[?&]id=([^&]+)/);
  if (m && url.includes("drive.google.com"))
    return `https://drive.google.com/file/d/${m[1]}/preview`;

  // if already preview
  if (url.includes("/preview")) return url;

  return url;
};

const toSheetsFrameUrls = (raw) => {
  const url = String(raw || "").trim().replace(/^["']+|["']+$/g, "");
  if (!url) return { embed: "", open: "" };

  // If it's a normal Sheets URL: /spreadsheets/d/<id>/
  let m = url.match(/docs\.google\.com\/spreadsheets\/d\/([^/?#]+)/i);
  if (m) {
    const id = m[1];
    return {
      // Drive preview often looks more "full UI" inside iframe for demo
      embed: `https://drive.google.com/file/d/${id}/preview`,
      // Open in new tab to real sheet
      open: `https://docs.google.com/spreadsheets/d/${id}/edit?usp=sharing`,
    };
  }

  // If it's a Drive file link already
  m = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i);
  if (m) {
    const id = m[1];
    return {
      embed: `https://drive.google.com/file/d/${id}/preview`,
      open: `https://docs.google.com/spreadsheets/d/${id}/edit?usp=sharing`,
    };
  }

  // If it's a published URL (d/e/.../pubhtml) we can't reconstruct the edit URL reliably
  return { embed: url, open: url };
};

const isDirectVideoFile = (url) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(String(url || ""));

const renderCourseContent = (courseId) => {
    const user = STATE.user;
    const course = COURSES[courseId];

    // Security: check if user owns this (mirrors TSX: Navigate to /dashboard)
    const owns =
      (user && user.purchasedCourses && user.purchasedCourses.includes(courseId || "")) ||
      getPurchasedList().includes(courseId || "");

      if (!owns) {
      navigate("/dashboard");
      return "";
      }


    if (!course) {
      return `<div class="p-20 text-center">Course not found.</div>`;
    }

    const cc = STATE.courseContent;
    const activeTab = cc.activeTab;

    const selectedVideo =
      course.content.videos.find((v) => v.id === cc.selectedVideoId) || null;
    const selectedVideoEmbedUrl = selectedVideo ? toVideoEmbedUrl(selectedVideo.url) : "";
    const selectedVideoIsFile = selectedVideoEmbedUrl && isDirectVideoFile(selectedVideoEmbedUrl);
    const selectedEbook =
      course.content.ebooks.find((e) => e.id === cc.selectedEbookId) || null;
    const selectedWorkbook =
      course.content.workbooks.find((w) => w.id === cc.selectedWorkbookId) ||
      course.content.workbooks[0] ||
      null;
    
    const wbRawUrl = selectedWorkbook ? (selectedWorkbook.embedUrl || selectedWorkbook.url || "") : "";
    const wbFrame = toSheetsFrameUrls(wbRawUrl);

    // Use this for iframe src
    const wbEmbedUrl = wbFrame.embed || "";

    // Use this for "Open in New Tab"
    const wbOpenUrl = wbFrame.open || wbRawUrl;

    return `
<div id="course-content-root" class="bg-white min-h-screen flex flex-col">
  <div class="bg-slate-900 text-white py-4 px-6 sm:px-8 border-b border-slate-800">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex items-center space-x-4">
        <a href="#/dashboard" class="p-2 hover:bg-white/10 rounded-full transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </a>
        <div>
          <h1 class="text-lg font-bold truncate max-w-xs md:max-w-md">${escapeHtml(
            course.title
          )}</h1>
          <p class="text-xs text-slate-400 font-medium uppercase tracking-widest">${escapeHtml(
            course.level
          )} Experience</p>
        </div>
      </div>

      <div class="flex bg-slate-800 p-1 rounded-xl self-center md:self-auto w-full md:w-auto">
        ${["video", "ebook", "workbook"]
          .map(
            (tab) => `
          <button data-action="content-tab" data-tab="${tab}"
          class="flex-1 md:flex-none px-4 py-2 text-sm font-bold rounded-lg capitalize transition-all ${
              activeTab === tab ? "bg-yellow-500 text-white" : "text-slate-400 hover:text-white"
            }">${tab}</button>`
          )
          .join("")}
      </div>
    </div>
  </div>

  <div class="flex-grow flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 sm:p-8 gap-8">
    <div class="lg:w-80 flex-shrink-0 space-y-6">
      <div class="bg-yellow-500 rounded-[2rem] p-6 text-white shadow-xl shadow-yellow-100">
        <h3 class="text-xs font-black uppercase tracking-widest mb-4 opacity-70">Course Progress</h3>
        <div class="space-y-4">
          <div>
            <div class="flex justify-between text-[10px] font-black uppercase mb-1"><span>Videos</span><span>${calculateProgress(
              "videos"
            )}%</span></div>
            <div class="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
              <div class="h-full bg-white transition-all duration-500" style="width:${calculateProgress(
                "videos"
              )}%"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-[10px] font-black uppercase mb-1"><span>Ebooks</span><span>${calculateProgress(
              "ebooks"
            )}%</span></div>
            <div class="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
              <div class="h-full bg-white transition-all duration-500" style="width:${calculateProgress(
                "ebooks"
              )}%"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-[10px] font-black uppercase mb-1"><span>Workbooks</span><span>${calculateProgress(
              "workbooks"
            )}%</span></div>
            <div class="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
              <div class="h-full bg-white transition-all duration-500" style="width:${calculateProgress(
                "workbooks"
              )}%"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-slate-50 rounded-3xl p-6 border border-slate-100">
        <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Available ${activeTab}s</h3>
        <div class="space-y-2">
          ${
            activeTab === "video"
              ? course.content.videos
                  .map((v) => {
                    const isSel = selectedVideo && selectedVideo.id === v.id;
                    const done = isCompleted("videos", v.id);
                    return `
            <button data-action="content-select" data-type="video" data-id="${escapeHtml(
              v.id
            )}" class="w-full text-left p-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-between group ${
                      isSel
                        ? "bg-yellow-500 text-white shadow-lg shadow-yellow-100"
                        : "bg-white text-slate-600 hover:bg-yellow-50 border border-slate-100 hover:border-yellow-100"
                    }">
              <span class="truncate pr-2">${escapeHtml(v.title)}</span>
              ${
                done
                  ? `<div class="${
                      isSel ? "bg-white/20" : "bg-emerald-100"
                    } p-1 rounded-full flex-shrink-0">
                    <svg class="w-3 h-3 ${
                      isSel ? "text-white" : "text-emerald-600"
                    }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>`
                  : ""
              }
            </button>`;
                  })
                  .join("")
              : activeTab === "ebook"
              ? course.content.ebooks
                  .map((e) => {
                    const isSel = selectedEbook && selectedEbook.id === e.id;
                    const done = isCompleted("ebooks", e.id);
                    return `
            <button data-action="content-select" data-type="ebook" data-id="${escapeHtml(
              e.id
            )}" class="w-full text-left p-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-between group ${
                      isSel
                        ? "bg-yellow-500 text-white shadow-lg shadow-yellow-100"
                        : "bg-white text-slate-600 hover:bg-yellow-50 border border-slate-100 hover:border-yellow-100"
                    }">
              <span class="truncate pr-2">${escapeHtml(e.title)}</span>
              ${
                done
                  ? `<div class="${
                      isSel ? "bg-white/20" : "bg-emerald-100"
                    } p-1 rounded-full flex-shrink-0">
                    <svg class="w-3 h-3 ${
                      isSel ? "text-white" : "text-emerald-600"
                    }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>`
                  : ""
              }
            </button>`;
                  })
                  .join("")
              : course.content.workbooks
                  .map((w) => {
                    const isSel = selectedWorkbook && selectedWorkbook.id === w.id;
                    const done = isCompleted("workbooks", w.id);
                    return `
            <button data-action="content-select" data-type="workbook" data-id="${escapeHtml(
              w.id
            )}" class="w-full text-left p-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-between group ${
                      isSel
                        ? "bg-yellow-500 text-white shadow-lg shadow-yellow-100"
                        : "bg-white text-slate-600 hover:bg-yellow-50 border border-slate-100 hover:border-yellow-100"
                    }">
              <span class="truncate pr-2">${escapeHtml(w.title)}</span>
              ${
                done
                  ? `<div class="${
                      isSel ? "bg-white/20" : "bg-emerald-100"
                    } p-1 rounded-full flex-shrink-0">
                    <svg class="w-3 h-3 ${
                      isSel ? "text-white" : "text-emerald-600"
                    }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>`
                  : ""
              }
            </button>`;
                  })
                  .join("")
          }
        </div>
      </div>
    </div>

    <div class="flex-grow flex flex-col">
      <div class="bg-slate-50 rounded-[2rem] overflow-hidden flex-grow flex flex-col border border-slate-100 shadow-inner min-h-[600px]">

        ${
          activeTab === "video" && selectedVideo
            ? `
        <div class="flex-grow flex flex-col">
          <div class="w-full bg-black" style="position:relative; padding-top:56.25%;">
            ${
              selectedVideoIsFile
                ? `<video
                    src="${escapeHtml(selectedVideoEmbedUrl)}"
                    data-autocomplete-type="videos"
                    data-autocomplete-id="${escapeHtml(selectedVideo.id)}"
                    style="position:absolute; inset:0; width:100%; height:100%;"
                    controls
                    playsinline
                  ></video>`
                : `<iframe
                    src="${escapeHtml(selectedVideoEmbedUrl)}"
                    data-yt-autocomplete="1"
                    data-autocomplete-type="videos"
                    data-autocomplete-id="${escapeHtml(selectedVideo.id)}"
                    style="position:absolute; inset:0; width:100%; height:100%; border:0;"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen
                  ></iframe>`
            }
          </div>
          <div class="p-8 flex flex-col sm:flex-row items-start justify-between gap-6">
            <div class="flex-1">
              <h2 class="text-2xl font-bold text-slate-900 mb-2">${escapeHtml(
                selectedVideo.title
              )}</h2>
              <p class="text-slate-600 leading-relaxed">${
                selectedVideo.description
                  ? escapeHtml(selectedVideo.description)
                  : "Watch carefully and take notes as we build out the framework for success."
              }</p>
            </div>

            <button data-action="content-toggle" data-type="videos" data-id="${escapeHtml(
              selectedVideo.id
            )}" class="flex items-center space-x-2 px-6 py-3 rounded-xl font-black text-sm transition-all flex-shrink-0 ${
              isCompleted("videos", selectedVideo.id)
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100"
                : "bg-white text-yellow-600 border border-yellow-200 hover:border-yellow-600"
            }">
              ${
                isCompleted("videos", selectedVideo.id)
                  ? `
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
              <span>Watched</span>
              `
                  : `<span>Mark as Watched</span>`
              }
            </button>
          </div>
        </div>
        `
            : ""
        }

        ${
          activeTab === "ebook" && selectedEbook
            ? `
        <div class="flex-grow flex flex-col">
          <div id="ebook-scroll" class="flex-grow overflow-y-auto overflow-x-hidden p-6 sm:p-8 md:p-16 bg-white selection:bg-yellow-100 min-w-0">
            <div class="max-w-3xl mx-auto">
              <h1 class="text-4xl font-black text-slate-900 mb-10 border-b-8 border-yellow-100 inline-block">${escapeHtml(
                selectedEbook.title
              )}</h1>

              <div id="ebook-html" class="course-ebook-content prose prose-slate prose-lg break-words overflow-x-hidden">
                ${selectedEbook.content}
              </div>
            </div>
          </div>
          <div class="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
            <button data-action="content-toggle" data-type="ebooks" data-id="${escapeHtml(
              selectedEbook.id
            )}" class="flex items-center space-x-2 px-8 py-4 rounded-xl font-black text-base transition-all ${
                isCompleted("ebooks", selectedEbook.id)
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100"
                  : "bg-yellow-500 text-white shadow-lg shadow-yellow-100 hover:bg-yellow-600"
              }">
              ${
                isCompleted("ebooks", selectedEbook.id)
                  ? `
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
              <span>Completed Reading</span>
              `
                  : `<span>I've Finished Reading</span>`
              }
            </button>
          </div>

          <style>
            .course-ebook-content h2 { font-size: 2.5rem; font-weight: 800; color: #0f172a; margin-bottom: 2rem; margin-top: 2rem; border-bottom: 4px solid #4f46e5; display: inline-block; padding-bottom: 4px; }
            .course-ebook-content h3 { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin-top: 2.5rem; margin-bottom: 1rem; }
            .course-ebook-content p { color: #475569; line-height: 1.8; margin-bottom: 1.5rem; font-size: 1.1rem; }
            .course-ebook-content code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #4f46e5; }

            /* === Mobile horizontal overflow fix === */
            .course-ebook-content .table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; }
            .course-ebook-content .table-scroll table { width: max-content; min-width: 100%; border-collapse: collapse; }
            .course-ebook-content .table-scroll th, .course-ebook-content .table-scroll td { white-space: nowrap; word-break: normal; overflow-wrap: normal; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
            .course-ebook-content .table-scroll td:last-child { white-space: normal; min-width: 240px; }
          </style>
        </div>
        `
            : ""
        }

        ${
          activeTab === "workbook" && selectedWorkbook
            ? `
          <div class="flex-grow flex flex-col">
            <div class="flex-grow bg-white border-b border-slate-100">
              ${
                wbEmbedUrl
                  ? `
                <div class="h-full min-h-[500px] flex flex-col">
                  
                  <!-- Fake "Google Sheets" top chrome -->
                  <div class="bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
                    <div class="flex items-center justify-between gap-4">
                      
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="text-emerald-600">
                            <path d="M6 2h9l3 3v17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="2"/>
                            <path d="M15 2v4h4" stroke="currentColor" stroke-width="2"/>
                            <path d="M8 10h8M8 14h8M8 18h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                          </svg>
                        </div>

                        <div class="min-w-0">
                          <div class="font-bold text-slate-900 truncate">${escapeHtml(selectedWorkbook.title)}</div>
                          <div class="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                            View only • Demo preview
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center gap-2 shrink-0">
                        <span class="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                          View only
                        </span>

                        <a
                          target="_blank"
                          rel="noopener"
                          href="${escapeHtml(wbOpenUrl)}"
                          class="inline-flex items-center justify-center px-4 py-2 rounded-xl font-black text-xs bg-white text-slate-700 border border-slate-200 hover:border-slate-400 transition"
                        >
                          Open
                        </a>
                      </div>
                    </div>

                    <div class="mt-3 hidden md:flex items-center gap-4 text-xs font-bold text-slate-500">
                      <span class="hover:text-slate-900 cursor-default">File</span>
                      <span class="hover:text-slate-900 cursor-default">Edit</span>
                      <span class="hover:text-slate-900 cursor-default">View</span>
                      <span class="hover:text-slate-900 cursor-default">Insert</span>
                      <span class="hover:text-slate-900 cursor-default">Format</span>
                      <span class="hover:text-slate-900 cursor-default">Data</span>
                      <span class="hover:text-slate-900 cursor-default">Tools</span>
                    </div>
                  </div>

                  <!-- Actual embed -->
                  <div class="flex-1 min-h-0">
                    <iframe
                      data-scroll-lock="worksheet"
                      src="${escapeHtml(wbEmbedUrl)}"
                      class="w-full h-full min-h-[500px] border-none"
                      title="${escapeHtml(selectedWorkbook.title)}"
                      loading="lazy"
                      referrerpolicy="no-referrer-when-downgrade"
                    ></iframe>
                  </div>
                </div>
                `
                  : `
                <div class="h-full min-h-[500px] flex flex-col items-center justify-center p-16 text-center">
                  <div class="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-5">
                    <svg class="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                  </div>
                  <h2 class="text-xl font-black text-slate-900 mb-2">Workbook URL is missing</h2>
                  <p class="text-slate-500 max-w-md">Please set workbook.url or workbook.embedUrl in the course data.</p>
                </div>
                `
              }
            </div>

            <div class="p-8 bg-yellow-50 border-t border-yellow-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div class="flex-1">
                <h3 class="text-lg font-bold text-yellow-900 mb-1">${escapeHtml(selectedWorkbook.title)}</h3>
                <p class="text-yellow-700 text-sm">
                  This is an embedded preview. If your browser blocks cookies and you can’t interact, open it in a new tab.
                </p>
              </div>

              <div class="grid grid-cols-2 lg:grid-cols-1 gap-3 w-full max-w-xl lg:max-w-sm ml-auto">
                <a
                  target="_blank"
                  rel="noopener"
                  href="${escapeHtml(wbRawUrl || wbEmbedUrl)}"
                  class="w-full px-4 py-3 rounded-xl font-black text-sm bg-white text-yellow-700 border border-yellow-200 hover:border-yellow-500 transition text-center flex items-center justify-center"
                >
                  Open in Google Sheets
                </a>

                <button
                  data-action="content-toggle"
                  data-type="workbooks"
                  data-id="${escapeHtml(selectedWorkbook.id)}"
                  class="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-black text-sm transition-all ${
                    isCompleted("workbooks", selectedWorkbook.id)
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100"
                      : "bg-white text-yellow-600 border border-yellow-200 hover:border-yellow-600"
                  }"
                >
                  ${
                    isCompleted("workbooks", selectedWorkbook.id)
                      ? `
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Completed</span>
                  `
                      : `<span>Mark as Complete</span>`
                  }
                </button>
              </div>
            </div>
          </div>
          `
            : ""
        }

        ${
          (activeTab === "video" && !selectedVideo) ||
          (activeTab === "ebook" && !selectedEbook) ||
          (activeTab === "workbook" && !selectedWorkbook)
            ? `
        <div class="flex-grow flex flex-col items-center justify-center p-20 text-center">
          <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">No ${activeTab}s available</h2>
          <p class="text-slate-500">More content will be released for this section soon.</p>
        </div>
        `
            : ""
        }

      </div>

      <div class="mt-6 text-center">
        <p class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          &copy; DEMO E-LEARNING CONTENT PROTECTION ACTIVE | USER: ${escapeHtml(
            user.id
          )} | DO NOT SHARE CREDENTIALS
        </p>
      </div>
    </div>
  </div>
</div>
`;
  };

export default renderCourseContent;