// GAS 웹 앱 배포 URL (이곳에 복사한 URL을 붙여넣으세요)
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwh-kUJUkJzolarvA9UEdId36oHG5VknjKMtgzTsTqRDwp2TCOqoNUDFv9PtyuK3vtC/exec";

/**
 * 1. 학생 로그인 요청
 */
async function apiLogin(studentId, studentName) {
  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // GAS CORS 이슈 회피용
      body: JSON.stringify({
        action: "login",
        studentId: studentId,
        studentName: studentName
      })
    });
    return await response.json();
  } catch (error) {
    console.error("Login API Error:", error);
    return { success: false, message: "통신 중 오류가 발생했습니다. 네트워크를 확인해 주세요." };
  }
}

/**
 * 2. 전체 미션 목록 조회
 */
async function apiGetMissions() {
  try {
    const response = await fetch(`${GAS_API_URL}?action=getMissions`);
    return await response.json();
  } catch (error) {
    console.error("GetMissions API Error:", error);
    return { success: false, message: "미션 정보를 불러오지 못했습니다." };
  }
}

/**
 * 3. 미션 정답 제출
 */
async function apiSubmitMission(studentId, missionId, answer) {
  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "submitMission",
        studentId: studentId,
        missionId: missionId,
        answer: answer
      })
    });
    return await response.json();
  } catch (error) {
    console.error("Submit API Error:", error);
    return { success: false, message: "제출 실패: 네트워크 상태를 확인하고 다시 시도해 주세요." };
  }
}
