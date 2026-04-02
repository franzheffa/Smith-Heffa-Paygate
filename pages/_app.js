import EnterpriseFooter from "../components/layout/EnterpriseFooter";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <EnterpriseFooter />
    </>
  );
}
