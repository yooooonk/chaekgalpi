import { Navigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'

export default function LoginPage() {
  const { token, login, clientIdMissing } = useApp()

  if (token) return <Navigate to="/save" replace />

  return (
    <div className="landing">
      <div className="landing-card">
        <h1 className="logo">책갈피</h1>
        <p className="tagline">문장을 모으고, 의미로 찾는 공간</p>
        <button className="btn btn-google" onClick={login}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt=""
            width={20}
          />
          Google로 시작하기
        </button>
        {clientIdMissing && (
          <p className="warning">
            ⚠️ <code>VITE_GOOGLE_CLIENT_ID</code>가 설정되지 않았습니다.
            <br />
            <code>.env</code> 파일을 확인하세요.
          </p>
        )}
      </div>
    </div>
  )
}
