import { InfoPage } from "@/components/info-page";
import { CREDITS } from "@/lib/credits";
import styles from "./credits.module.css";

export const metadata = { title: "Photo credits | VIERCYS" };

export default function Credits() {
  return (
    <InfoPage
      title="Photo credits."
      kicker="Photography"
      intro="Every photograph on this site shows a real place, not a VIERCYS property. Thank you to the photographers who share their work under open licences."
    >
      <div
        className={styles.wrap}
        tabIndex={0}
        role="region"
        aria-label="Photo credits, scrolls sideways on small screens"
      >
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Photograph</th>
              <th scope="col">Creator</th>
              <th scope="col">Licence</th>
            </tr>
          </thead>
          <tbody>
            {CREDITS.map((credit) => (
              <tr key={credit.file}>
                <td>
                  {credit.source.startsWith("http") &&
                  !credit.source.includes(" ") ? (
                    <a href={credit.source} rel="noreferrer">
                      {credit.subject}
                    </a>
                  ) : (
                    credit.subject
                  )}
                </td>
                <td>{credit.creator}</td>
                <td>{credit.license}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InfoPage>
  );
}
