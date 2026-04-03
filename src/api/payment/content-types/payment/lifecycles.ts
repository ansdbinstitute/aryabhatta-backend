export default {
  async beforeCreate(event) {
    const { data } = event.params;

    if (!data.receiptNumber) {
      try {
        const settingsRaw = await strapi.entityService.findMany('api::institute-setting.institute-setting');
        const settings = Array.isArray(settingsRaw) ? settingsRaw[0] : settingsRaw;
        const prefix = settings?.receiptPrefix || 'REC-';

        const allPayments = await strapi.entityService.findMany('api::payment.payment');
        const seqNumber = (allPayments.length + 1).toString().padStart(5, '0');

        data.receiptNumber = `${prefix}${seqNumber}`; // Example: REC-00001
      } catch (err) {
        strapi.log.error('Error generating Payment Receipt Number:', err);
        data.receiptNumber = `REC-${Date.now()}`;
      }
    }
  }
};
