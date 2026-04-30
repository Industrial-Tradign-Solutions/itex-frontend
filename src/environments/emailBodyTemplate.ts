export const emailBodyTemplates = {
  ip_quote_request: (contactName?: string) => `<b>**Please do not change the subject when replying**</b><br><br>Hello${contactName ? ' ' + contactName : ''},<br><br>Could you provide me with your best offer for the products in the attachment?<br><br><h4><b>Condition:</b> New and Genuine and add the Datasheet.</h4><br><h3><b>Please see attached files for more details.</b></h3><br>Additionally, can you include <b>delivery time, weight and shipping cost to Miami 33134.</b><br><br>Best Regards`,
}
