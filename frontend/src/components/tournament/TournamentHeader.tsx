import React from "react";
import { useTranslation } from "../../shared/Translation";

const TournamentHeader: React.FC = () => {
  const { t } = useTranslation();
  return (
  <header className="mb-6 text-center font-hand">
    <h1 className="text-4xl">{t("tournament.title")}</h1>
  </header>
  );
};

export default TournamentHeader;
