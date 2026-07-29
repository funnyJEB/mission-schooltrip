// 전역 상태 데이터
let currentUser = null;
let allMissions = [];
let completedMissions = []; // 완수한 미션 ID 목록
let currentLocation = "장소A";
let activeMissionId = null;

// DOM 요소
const loginSection = document.getElementById("login-section");
const mainSection = document.getElementById("main-section");
const loginForm = document.getElementById("login-form");
const missionList = document.getElementById("mission-list");

// 모달 요소
const missionModal = document.getElementById("mission-modal");
const pwModal = document.getElementById("pw-modal");
const btnOpenPwModal = document.getElementById("btn-open-pw-modal");
const btnLogout = document.getElementById("btn-logout");
const btnPwClose = document.getElementById("btn-pw-close");
const btnPwSubmit = document.getElementById("btn-pw-submit");

// 앱 시작 시 무조건 로그인 화면으로 강제 초기화
window.addEventListener("DOMContentLoaded", () => {
  // 기존에 저장된 유저 데이터 및 세션 완벽 삭제
  localStorage.removeItem("mission_user");
  currentUser = null;

  // 장소 탭 클릭 이벤트 등록
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentLocation = e.target.dataset.location;
      renderMissions();
    });
  });
});

// 로그인 제출 핸들러
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("input-id").value.trim();
  const name = document.getElementById("input-name").value.trim();
  const password = document.getElementById("input-password").value.trim();

  const res = await apiLogin(id, name, password);
  if (res.success) {
    currentUser = res.student;
    showMainScreen();
  } else {
    alert(res.message);
  }
});

// 로그아웃 버튼 핸들러 (강제 초기화 및 로그인 화면으로 이동)
if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    localStorage.clear();
    currentUser = null;
    completedMissions = [];
    
    // 입력 창 초기화
    document.getElementById("input-id").value = "";
    document.getElementById("input-name").value = "";
    document.getElementById("input-password").value = "";

    // 화면 전환
    mainSection.classList.add("hidden");
    loginSection.classList.remove("hidden");
  });
}

// 메인 화면 표시 및 미션 데이터 로드
async function showMainScreen() {
  loginSection.classList.add("hidden");
  mainSection.classList.remove("hidden");

  document.getElementById("user-display").innerText = `${currentUser.id} ${currentUser.name}`;
  document.getElementById("user-team-tag").innerText = `${currentUser.team}`;
  document.getElementById("user-score").innerText = currentUser.totalScore;

  // 서버에서 미션 목록 가져오기
  const res = await apiGetMissions();
  if (res.success) {
    allMissions = res.missions;
    
    // 전체 총점 계산하여 분모에 표시
    const maxScore = allMissions.reduce((acc, cur) => acc + (Number(cur.points) || 0), 0);
    document.getElementById("total-possible-score").innerText = maxScore;

    renderMissions();
  }
}

// 미션 목록 동적 렌더링
function renderMissions() {
  missionList.innerHTML = "";
  
  // 장소 명칭 공백 및 대소문자 무시 비교
  const targetLoc = currentLocation.replace(/\s+/g, "").toLowerCase();
  const filtered = allMissions.filter(m => {
    if (!m.location) return false;
    return String(m.location).replace(/\s+/g, "").toLowerCase() === targetLoc;
  });

  if (filtered.length === 0) {
    missionList.innerHTML = `
      <div style="text-align:center; padding: 40px 20px; color:#a0aec0;">
        <p style="font-size:32px; margin-bottom:8px;">🏜️</p>
        <p>등록된 미션이 없습니다.</p>
      </div>`;
    return;
  }

  filtered.forEach(m => {
    const isDone = completedMissions.includes(m.missionId);
    const card = document.createElement("div");
    card.className = `mission-card ${isDone ? 'completed' : ''}`;
    card.innerHTML = `
      <div>
        <div class="mission-title">${m.title}</div>
        <div class="mission-pts">+${m.points}점</div>
      </div>
      <button class="btn-action" ${isDone ? 'disabled' : ''} onclick="openMissionModal('${m.missionId}')">
        ${isDone ? '완료' : '도전'}
      </button>
    `;
    missionList.appendChild(card);
  });
}

// 미션 제출 모달 창 제어
function openMissionModal(missionId) {
  const mission = allMissions.find(m => m.missionId === missionId);
  if (!mission) return;

  activeMissionId = missionId;
  document.getElementById("modal-title").innerText = mission.title;
  document.getElementById("modal-desc").innerText = mission.description;
  document.getElementById("modal-answer").value = "";
  missionModal.classList.remove("hidden");
}

document.getElementById("btn-modal-close").addEventListener("click", () => {
  missionModal.classList.add("hidden");
});

document.getElementById("btn-modal-submit").addEventListener("click", async () => {
  const answer = document.getElementById("modal-answer").value.trim();
  if (!answer) {
    alert("정답 또는 입력값을 작성해 주세요.");
    return;
  }

  const res = await apiSubmitMission(currentUser.id, activeMissionId, answer);
  if (res.success) {
    alert(`🎉 미션 성공! +${res.pointsAdded}점을 획득했습니다.`);
    currentUser.totalScore = res.newScore;
    document.getElementById("user-score").innerText = res.newScore;

    completedMissions.push(activeMissionId);
    missionModal.classList.add("hidden");
    renderMissions();
  } else {
    alert(res.message);
  }
});

// 비밀번호 변경 모달 제어
btnOpenPwModal.addEventListener("click", () => {
  document.getElementById("input-curr-pw").value = "";
  document.getElementById("input-new-pw").value = "";
  document.getElementById("input-new-pw-confirm").value = "";
  pwModal.classList.remove("hidden");
});

btnPwClose.addEventListener("click", () => {
  pwModal.classList.add("hidden");
});

btnPwSubmit.addEventListener("click", async () => {
  const currentPw = document.getElementById("input-curr-pw").value.trim();
  const newPw = document.getElementById("input-new-pw").value.trim();
  const newPwConfirm = document.getElementById("input-new-pw-confirm").value.trim();

  if (!currentPw || !newPw || !newPwConfirm) {
    alert("모든 입력란을 작성해 주세요.");
    return;
  }

  if (newPw !== newPwConfirm) {
    alert("새 비밀번호가 서로 일치하지 않습니다.");
    return;
  }

  if (newPw.length < 4) {
    alert("새 비밀번호는 최소 4자리 이상이어야 합니다.");
    return;
  }

  const res = await apiChangePassword(currentUser.id, currentPw, newPw);
  if (res.success) {
    alert(res.message);
    pwModal.classList.add("hidden");
  } else {
    alert(res.message);
  }
});
