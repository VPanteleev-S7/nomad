/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import AbstractAbility from './abstract';
import { alias, and } from '@ember/object/computed';
import { computed } from '@ember/object';

export default class Namespace extends AbstractAbility {
  @alias('selfTokenIsManagement') canRead;
  @alias('selfTokenIsManagement') canList;
  @alias('selfTokenIsManagement') canWrite;
  @alias('selfTokenIsManagement') canUpdate;
  @alias('selfTokenIsManagement') canDestroy;

  @and('nodePoolGovernanceIsPresent', 'selfTokenIsManagement')
  canConfigureNodePools;

  @computed('features.[]')
  get nodePoolGovernanceIsPresent() {
    return this.featureIsPresent('Node Pools Governance');
  }
}
