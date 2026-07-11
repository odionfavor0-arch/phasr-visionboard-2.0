import MarketingNav from './MarketingNav'
import MarketingFooter from './MarketingFooter'

const STYLES = `
.mkt-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  font-family: 'Manrope', sans-serif;
  overflow-x: hidden;
  width: 100%;
}
.mkt-page-body {
  flex: 1;
  padding-top: 80px;
}
.mkt-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 32px;
}
.mkt-container-narrow {
  max-width: 760px;
  margin: 0 auto;
  padding: 0 32px;
}
@media (max-width: 768px) {
  .mkt-container,
  .mkt-container-narrow { padding: 0 20px; }
}
`

export default function MarketingLayout({ children }) {
  return (
    <>
      <style>{STYLES}</style>
      <div className="mkt-page">
        <MarketingNav />
        <main className="mkt-page-body">
          {children}
        </main>
        <MarketingFooter />
      </div>
    </>
  )
}
