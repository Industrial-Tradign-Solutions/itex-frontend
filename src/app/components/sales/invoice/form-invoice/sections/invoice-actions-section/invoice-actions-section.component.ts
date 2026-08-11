import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Action bar of the invoice detail: lifecycle transitions (§15) plus the
 * document actions (§18) and the two shortcuts every module has (clone,
 * history).
 *
 * Purely presentational — it renders buttons and emits. Every enablement rule
 * (permission + status + payments + lock) is decided by the container, which is
 * the one holding the invoice; passing booleans instead of the whole invoice
 * keeps that policy in a single place and this component trivially testable.
 */
@Component({
  selector: 'app-invoice-actions-section',
  templateUrl: './invoice-actions-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceActionsSectionComponent {

  // Visibility answers "does this action exist here at all" (permission +
  // status). Enablement answers "can it run right now" (data preconditions).
  // Mixing the two hides a button the user is entitled to, or shows one that
  // makes no sense for the state — an Issue button on a paid invoice.
  @Input() canIssue = false;
  @Input() issueEnabled = false;

  @Input() canRevert = false;
  @Input() canCancel = false;

  @Input() canDelete = false;
  // A draft that was ever issued keeps its number reserved forever, so it can
  // never be deleted (§15.4). Disabled with the reason in the tooltip: hiding it
  // would read as a missing permission, which is a different problem.
  @Input() deleteLocked = false;

  @Input() canClone = false;
  @Input() canViewHistory = false;

  @Input() canPrint = false;
  @Input() printEnabled = false;
  @Input() canSend = false;
  @Input() sendEnabled = false;

  // The PDF of a draft is regenerated on every call and is not the official
  // document; the user has to know before sending it anywhere.
  @Input() draftPdf = false;

  @Input() loadingDownload = false;
  @Input() loadingSend = false;

  @Output() issue = new EventEmitter<void>();
  @Output() revert = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() remove = new EventEmitter<void>();
  @Output() clone = new EventEmitter<void>();
  @Output() history = new EventEmitter<void>();
  @Output() print = new EventEmitter<void>();
  @Output() printAndSend = new EventEmitter<void>();

}
