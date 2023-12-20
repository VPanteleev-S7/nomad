/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

// @ts-check
import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';

export default class AccessControlNamespacesAclNamespaceController extends Controller {
  @service notifications;
  @service router;
  @service store;

  @task(function* () {
    try {
      yield this.model.deleteRecord();
      yield this.model.save();
      if (this.store.peekRecord('namespace', this.model.id)) {
        this.store.unloadRecord(this.model);
      }
      this.notifications.add({
        title: 'Namespace Deleted',
        color: 'success',
        type: `success`,
        destroyOnClick: false,
      });
      this.router.transitionTo('access-control.namespaces');
    } catch (err) {
      this.notifications.add({
        title: `Error deleting Namespace ${this.model.name}`,
        message: err,
        color: 'critical',
        sticky: true,
      });
    }
  })
  deleteNamespace;
}
