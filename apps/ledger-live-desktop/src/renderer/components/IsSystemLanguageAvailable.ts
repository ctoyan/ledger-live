import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { languageSelector, getInitialLanguageLocale } from "~/renderer/reducers/settings";
import { Locale, pushedLanguages } from "~/config/languages";

// To reset os language proposition, change this date !
const lastAskedLanguageAvailable = "2022-09-23";
export function hasAnsweredLanguageAvailable() {
  return global.localStorage.getItem("hasAnsweredLanguageAvailable") === lastAskedLanguageAvailable;
}
export function answerLanguageAvailable() {
  return global.localStorage.setItem("hasAnsweredLanguageAvailable", lastAskedLanguageAvailable);
}
const IsSystemLanguageAvailable = () => {
  const dispatch = useDispatch();
  const currentLanguage = useSelector(languageSelector);
  const defaultLanguage = getInitialLanguageLocale();
  useEffect(() => {
    if (
      !hasAnsweredLanguageAvailable() &&
      currentLanguage !== defaultLanguage &&
      pushedLanguages.includes(defaultLanguage as Locale)
    ) {
      dispatch(
        openModal("MODAL_SYSTEM_LANGUAGE_AVAILABLE", {
          osLanguage: defaultLanguage,
          currentLanguage,
        }),
      );
    }
  }, [defaultLanguage, dispatch, currentLanguage]);
  return null;
};
export default IsSystemLanguageAvailable;
