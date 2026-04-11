const ssiService = {
    async verify(credential) {
        const mapping = { 'did:gtd:med-004': 'MOICA_CERT', 'did:gtd:univ-992': 'NHI_CARD_PIN' };
        const ial = mapping[credential.did] || 'MYDATA_LIGHT';
        return {
            signatureValid: !!credential.did,
            didResolved: true,
            ial: ial,
            issuer: "Global Trust Registry"
        };
    }
};
module.exports = ssiService;
