/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

// @ts-check

import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import { tracked } from '@glimmer/tracking';
import { computed } from '@ember/object';
import Component from '@glimmer/component';
import messageFromAdapterError from 'nomad-ui/utils/message-from-adapter-error';

export default class NamespaceEditorComponent extends Component {
  @service notifications;
  @service router;
  @service store;
  @service can;

  @tracked JSONError = null;

  @alias('args.namespace') namespace;

  @computed(
    'namespace.{description,capabilities,meta,quota,nodePoolConfiguration}'
  )
  get definition() {
    let definitionHash = {};
    definitionHash['Description'] = this.namespace.description;
    definitionHash['Capabilities'] = this.namespace.capabilities;
    definitionHash['Meta'] = this.namespace.meta;

    if (this.can.can('configure-node-pools namespace')) {
      definitionHash['NodePoolConfiguration'] =
        this.namespace.nodePoolConfiguration;
    }

    if (this.can.can('configure-quotas namespace')) {
      definitionHash['Quota'] = this.namespace.quota;
    }

    return JSON.stringify(definitionHash, null, 4);
  }

  @action updateNamespaceName({ target: { value } }) {
    this.namespace.set('name', value);
  }

  @action updateNamespaceFromDefinition(value) {
    try {
      let definitionHash = JSON.parse(value);
      this.JSONError = null;

      this.namespace.set('description', definitionHash['Description']);
      this.namespace.set('capabilities', definitionHash['Capabilities']);
      this.namespace.set('meta', definitionHash['Meta']);

      if (this.can.can('configure-node-pools namespace')) {
        this.namespace.set(
          'nodePoolConfiguration',
          definitionHash['NodePoolConfiguration']
        );
      }

      if (this.can.can('configure-quotas namespace')) {
        this.namespace.set('quota', definitionHash['Quota']);
      }
    } catch (_error) {
      this.JSONError = 'Invalid JSON';
    }
  }

  @action async save(e) {
    if (e instanceof Event) {
      e.preventDefault(); // code-mirror "command+enter" submits the form, but doesnt have a preventDefault()
    }
    try {
      const nameRegex = '^[a-zA-Z0-9-]{1,128}$';
      if (!this.namespace.name?.match(nameRegex)) {
        throw new Error(
          `Namespace name must be 1-128 characters long and can only contain letters, numbers, and dashes.`
        );
      }

      const shouldRedirectAfterSave = this.namespace.isNew;

      // TODO: Nomitch - this incorrectly fires if you error on save then resave
      if (
        this.namespace.isNew &&
        this.store
          .peekAll('namespace')
          .filter((namespace) => namespace !== this.namespace)
          .findBy('name', this.namespace.name)
      ) {
        throw new Error(
          `A namespace with name ${this.namespace.name} already exists.`
        );
      }

      this.namespace.set('id', this.namespace.name);
      await this.namespace.save();

      this.notifications.add({
        title: 'Namespace Saved',
        color: 'success',
      });

      if (shouldRedirectAfterSave) {
        this.router.transitionTo(
          'access-control.namespaces.acl-namespace',
          this.namespace.name
        );
      }
    } catch (err) {
      console.log('was I run?');
      console.log(this.namespace);

      this.namespace.set('id', null);
      debugger;

      console.log(this.namespace);
      console.log('ca', this.namespace.changedAttributes());
      console.log('id', this.namespace.id);
      console.log('isNew', this.namespace.isNew);

      let title = this.namespace.isNew
        ? `Error creating Namespace ${this.namespace.name}`
        : `Error updating Namespace ${this.namespace.name}`;

      let error = 'Error saving namespace';
      if (err.errors?.length) {
        error = messageFromAdapterError(err);
      } else if (err.message) {
        error = err.message;
      }

      this.notifications.add({
        title,
        message: error,
        color: 'critical',
        sticky: true,
      });
    }
  }
}
