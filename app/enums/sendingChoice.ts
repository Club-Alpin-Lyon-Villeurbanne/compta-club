export enum SendingChoice {
    VALIDATE = 'validate',
    REJECT = 'reject',
}

export default SendingChoice;

export const getSendingChoiceTranslation = (choice: SendingChoice): string => {
    switch (choice) {
        case SendingChoice.VALIDATE:
            return 'Valider';
        case SendingChoice.REJECT:
            return 'Refuser';
        default:
            return 'Inconnu';
    }
}