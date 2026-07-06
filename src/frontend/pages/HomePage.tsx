import { useEffect, useState } from "react";
import { Card, OnboardingTour, EmptyState } from "../ui";
import { useAuth } from "../lib/authContext";

const ONBOARDING_SEEN_KEY = "erp_onboarding_seen";

export function HomePage() {
  const { me } = useAuth();
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_SEEN_KEY);
    if (!seen) {
      setTourOpen(true);
    }
  }, []);

  function closeTour() {
    localStorage.setItem(ONBOARDING_SEEN_KEY, "1");
    setTourOpen(false);
  }

  const hasNoMenu = me && me.permissions.length === 0;

  return (
    <div>
      <OnboardingTour
        open={tourOpen}
        onClose={closeTour}
        steps={[
          {
            title: "ยินดีต้อนรับ",
            description: "เริ่มต้นที่เมนูด้านซ้ายเพื่อดูงานที่ต้องทำวันนี้ตามบทบาทของคุณ"
          }
        ]}
      />
      {hasNoMenu ? (
        <EmptyState description="ยังไม่มีเมนูที่กำหนดให้บทบาทนี้ กรุณาติดต่อ Admin" />
      ) : (
        <Card title={`สวัสดี ${me?.fullName ?? ""}`}>
          <p>บทบาทของคุณ: {me?.role}</p>
          <p>เลือกเมนูด้านซ้ายเพื่อเริ่มทำงานตามหน้าที่ของคุณ</p>
        </Card>
      )}
    </div>
  );
}
