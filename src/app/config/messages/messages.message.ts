import { Modules } from "@config/types/tabs/modulesNames.type";
import { environment } from "../../../environments/environment";

export const Messages = {
  config: {
    interceptors: {
      auth: {
        token_error_signature: 'JWT signature does not match locally computed signature. JWT validity cannot be asserted and should not be trusted.',
        token_error_signature_response: 'The session has been terminated due to server errors',
        disable_system: 'The system is in a reboot, it will be enabled after 12:00AM.'
      }
    },
    tabs: {
      close_tab_action: (itemName: string) => `There are pending changes for "${itemName}", do you want to leave this tab without saving?`,
      max_open_tabs: (moduleName: string) => `No more than ${environment.max_open_tabs} ${moduleName} can be open.`
    },
    web_socket: {
      login_other_device: 'You are logged in on another device',
      disable: (moduleName: string) => `Your ${moduleName} has been disabled`,
      session_ended: 'Your session has timed out, you need to log in again',
      end_session: (time: number) => `Your session will end in ${time} minutes, we recommend you to save all changes`
    },
    auth: {
      problems: 'Connection Problems! Check system connection',
      error_server: 'No response from the server'
    }
  },
  pages: {
    administration: {
      users: {
        reset_password: (email: string) => `Are you sure you want to reset the password to the user: "<b>${email}</b>" ?
        <br><br>
        Remember that the new password will be sent to the user's email address and must be changed at the next login`,
        close_sesions: (offlineMinutes: number) => `Are you sure to end the sessions of all users?
        <br><br>
        A notification will be sent to users informing them that the system will be offline for the next 5 minutes.
        <br><br>
        Remember that the system will be inactive for "<b>${offlineMinutes}</b>" minutes.`,
        enable: (email: string) => enableMessage('user', email),
        disable: (email: string) => disableMessage('user', email)
      }
    },
    masters: {
      industries: {
        enable: (name: string) => enableMessage('industry', name),
        disable: (name: string) => disableMessage('industry', name)
      },
      departments: {
        enable: (name: string) => enableMessage('department', name),
        disable: (name: string) => disableMessage('department', name)
      },
      roles: {
        enable: (name: string) => enableMessage('role', name),
        disable: (name: string) => disableMessage('role', name),
        update_modules: (name?: string) => `The accesses of the role "${name}" were updated correctly`,
        update_actions: (name?: string) => `The actions of the role "${name}" were updated correctly`
      },
      brands: {
        importFile: 'The file has no brands for importing',
        enable: (name: string) => enableMessage('brand', name),
        disable: (name: string) => disableMessage('brand', name),
        unassignSupplier: (brandName: string, supplierName: string) => `Are you sure you want to unassign the supplier "${supplierName}" from the "${brandName}" brand?`
      },
    },
    partners: {
      openBy: (module: Modules, item: string, openBy: String) => openByMessage(module, item, openBy),
      remove_contact_phone: 'Are you sure you want to remove the contact phone?',
      remove_contact: 'Are you sure you want to remove the contact?',
      city_error: 'The city entered is not spelled correctly, select it from the list',
      warning_not_city_address: (fields: string[]) => {
        let message = '<b>The following fields are empty:</b> <br><br>';
        for (let field of fields) {
          message = message + `- ${field}<br>`
        }
        message = message + `<br> Please verify before saving`
        return message;
      },
      contact_error: (contactName: string) => `The Contact ${contactName} must have at least 1 phone number`,
      activate_partnert: (module: Modules,) => `It is necessary to verify ${module} information before changing status.`,
      change_prospect_to_client: (prospectName: string) => `Are you sure you want to convert the prospect "<b>${prospectName}</b>" into a client?`
    },
    ip: {
      products: {
        openBy: (module: Modules, item: string, openBy: String) => openByMessage(module, item, openBy),
        confirmDisable: (item: string) => `Are you sure you want to disable the product: "<b>${item}</b>" ?`,
        confirmEnable: (item: string) => `Are you sure you want to enable the product: "<b>${item}</b>" ?`,
        disableNotAllowed: 'You cannot deactivate the product',
        enableNotAllowed: 'You cannot activate the product',
        replaceNotAllowed: 'You cannot replace the product',
      },
      quoteRequest: {
        openBy: (module: Modules, item: string, openBy: String) => openByMessage(module, item, openBy),
        clone: (qrNumber: string) => `Are you sure you want to clone QR# "<b>${qrNumber}</b>"?
                                      <br><br>
                                      Please note that you will not have an assigned supplier
                                      `,
        removeProduct: (productName: string) => `Are you sure you want to delete the product "<b>${productName}</b>"?`,
        removeOtherCharge: (description: string, value: number, currency: string) => `Are you sure you want to delete the Other Charge "<b>${description}</b>", which is worth "${currency} ${value}"?`,
        changeStatus: (qrNumber: string, status: 'CREATED' | 'ANSWERED' | 'SENT' | 'COMPLETE' | 'REJECTED') => `Are you sure you want to change the status of QR# "<b>${qrNumber}</b>" to
        ${status.toLowerCase()}?`
      },
      purchaseOrder: {
        openBy: (module: Modules, item: string, openBy: String) => openByMessage(module, item, openBy),
        clone: (poNumber: string) => `Are you sure you want to clone PO# "<b>${poNumber}</b>"?
                                      <br><br>
                                      Please note that you will not have an assigned supplier
                                      `,
        removeProduct: (productName: string) => `Are you sure you want to delete the product "<b>${productName}</b>"?`,
        removeOtherCharge: (description: string, value: number, currency: string) => `Are you sure you want to delete the Other Charge "<b>${description}</b>", which is worth "${currency} ${value}"?`,
        changeStatus: (poNumber: string, status: 'CREATED' | 'ANSWERED' | 'SENT' | 'COMPLETE' | 'REJECTED') => `Are you sure you want to change the status of PO# "<b>${poNumber}</b>" to
        ${status.toLowerCase()}?`
      },
      quotation: {
        openBy: (module: Modules, item: string, openBy: String) => openByMessage(module, item, openBy),
        changeStatus: (qNumber: string, status: 'CREATED' | 'ANSWERED' | 'SENT' | 'COMPLETE' | 'REJECTED') => `Are you sure you want to change the status of Q# "<b>${qNumber}</b>" to
        ${status.toLowerCase()}?`,
        removeQrFromQuotation: (qrNumber: string) => `All products and information related to Quote Request "<b>${qrNumber}</b>" will be removed from this Quotation. Are you sure?`,
        clone: (qNumber: string) => `Are you sure you want to clone Q# "<b>${qNumber}</b>"?`,
        removeOtherCharge: (description: string, value: number, currency: string) => `Are you sure you want to delete the Other Charge "<b>${description}</b>", which is worth "${currency} ${value}"?`,
        addQuoteRequests: (count: number) => `Are you sure you want to add ${count} Quote Request(s) to this Quotation?`
      }
    }
  }
}

const enableMessage = (module: Modules, item: string) => `Are you sure you want to disable the ${module}: "<b>${item}</b>" ?`;
const disableMessage = (module: Modules, item: string) => `Are you sure you want to disable the ${module}: "<b>${item}</b>" ?`;
const openByMessage = (module: Modules, item: string, openBy: String) => `The ${module} ${item} is opened by:  <b>"${openBy}"</b>`;

