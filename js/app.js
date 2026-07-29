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
const modal = document.getElementById("mission-modal");

// 앱 초기화
window.addEventListener("DOMContentLoaded", () => {
  // 로컬 스토리지 로그인 확인
  const savedUser = localStorage.getItem("mission_user");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showMainScreen();
  }
  
  // 탭 클릭 이벤트
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentLocation = e.target.dataset.location;
      renderMissions();
    });
  });
});

// 로그인 이벤트
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("input-id").value;
  const name = document.getElementById("input-name").value;
  
  const res = await apiLogin(id, name);
  if (res.success) {
    currentUser = res.student;
    localStorage.setItem("mission_user", JSON.stringify(currentUser));
    showMainScreen();
  } else {
    alert(res.message);
  }
});

// 메인 화면 표시 및 미션 로드
async function showMainScreen() {
  loginSection.classList.add("hidden");
  mainSection.classList.remove("hidden");
  
  document.getElementById("user-display").innerText = `${currentUser.id} ${currentUser.name}`;
  document.getElementById("user-team-tag").innerText = `${currentUser.team}`;
  document.getElementById("user-score").innerText = currentUser.totalScore;

  // 서버에서 미션목록 가져오기
  const res = await apiGetMissions();
  if (res.success) {
    allMissions = res.missions;
    renderMissions();
  }
}

// 미션 목록 동적 렌더링
function renderMissions() {
  missionList.innerHTML = "";
  const filtered = allMissions.filter(m => m.location === currentLocation);

  if (filtered.length === 0) {
    missionList.innerHTML = `<p style="text-align:center; padding: 20px; color:#a0aec0;">해당 장소에 등록된 미션이 없습니다.</p>`;
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

// 미션 모달 창 열기
function openMissionModal(missionId) {
  const mission = allMissions.find(m => m.missionId === missionId);
  if (!mission) return;

  activeMissionId = missionId;
  document.getElementById("modal-title").innerText = mission.title;
  document.getElementById("modal-desc").innerText = mission.description;
  document.getElementById("modal-answer").value = "";
  modal.classList.remove("hidden");
}

// 모달 닫기
document.getElementById("btn-modal-close").addEventListener("click", () => {
  modal.classList.add("hidden");
});

// 미션 정답 제출
document.getElementById("btn-modal-submit").addEventListener("click", async () => {
  const answer = document.getElementById("modal-answer").value;
  if (!answer.trim()) {
    alert("정답 또는 입력값을 작성해 주세요.");
    return;
  }

  const res = await apiSubmitMission(currentUser.id, activeMissionId, answer);
  if (res.success) {
    alert(`🎉 미션 성공! +${res.pointsAdded}점을 획득했습니다.`);
    currentUser.totalScore = res.newScore;
    localStorage.setItem("mission_user", JSON.stringify(currentUser));
    document.getElementById("user-score").innerText = res.newScore;
    
    completedMissions.push(activeMissionId);
    modal.classList.add("hidden");
    renderMissions();
  } else {
    alert(res.message);
  }
});
