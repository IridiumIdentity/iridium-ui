import { Component, Inject, Input, OnInit } from '@angular/core';
import { DynamicContentViewItem } from '../dynamic-content-view-item';
import { ExternalProviderResponse } from '../../domain/external-provider-response';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { ExternalProviderTemplateService } from '../../../../services/external-provider-template.service';
import { ExternalProviderTemplateSummaryResponse } from '../../../../services/domain/external-provider-template-summary-response';
import { ExternalIdentityProviderService } from '../../../../services/external-identity-provider.service';

import { LoginDescriptorService } from '../../../../services/login-descriptor.service';

@Component({
  selector: 'update-external-provider-dialog',
  templateUrl: 'update-external-provider-dialog.html',
  styleUrls: ['update-external-provider-dialog.css'],
})
export class UpdateExternalProviderDialog {
  updateExternalProviderForm: UntypedFormGroup;
  constructor(
    public dialogRef: MatDialogRef<LoginBoxOverviewComponent>,
    private _formBuilder: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.updateExternalProviderForm = this._formBuilder.group({
      name: [
        { value: this.data.externalProvider.name, disabled: true },
        Validators.required,
      ],
      clientId: [this.data.externalProvider.clientId, Validators.required],
      clientSecret: [
        this.data.externalProvider.clientSecret,
        Validators.required,
      ],
    });
  }

  update() {
    this.dialogRef.close({ formGroup: this.updateExternalProviderForm });
  }
}
@Component({
  selector: 'add-external-provider-dialog',
  templateUrl: 'add-external-provider-dialog.html',
  styleUrls: ['add-external-provider-dialog.css'],
})
export class AddExternalProviderDialog {
  addProviderDialogFormGroup: UntypedFormGroup;

  constructor(
    public dialogRef: MatDialogRef<LoginBoxOverviewComponent>,
    private _formBuilder: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.addProviderDialogFormGroup = this._formBuilder.group({
      externalProviderTemplateId: ['', Validators.required],
      clientId: ['', Validators.required],
      clientSecret: ['', Validators.required],
    });
  }

  create() {
    this.dialogRef.close({ formGroup: this.addProviderDialogFormGroup });
  }
}

type ExternalProviderTemplateSummaryMapType = {
  [id: string]: ExternalProviderTemplateSummaryResponse;
};
@Component({
  selector: 'app-login-box-overview',
  templateUrl: './login-box-overview.component.html',
  styleUrls: ['./login-box-overview.component.css'],
})
export class LoginBoxOverviewComponent
  implements DynamicContentViewItem, OnInit
{
  @Input() data: any;
  displayedColumns: string[] = ['id', 'providerName'];
  dataSource: ExternalProviderResponse[] = [];
  externalProviderTemplateSummaries: ExternalProviderTemplateSummaryResponse[] =
    [];
  externalTemplateMapType: ExternalProviderTemplateSummaryMapType = {};
  updateTenantLogoFormGroup: UntypedFormGroup;
  currentLogoUrl = '';

  constructor(
    private externalProviderTemplateService: ExternalProviderTemplateService,
    private _formBuilder: UntypedFormBuilder,
    private loginDescriptorService: LoginDescriptorService,
    private dialog: MatDialog,
    private externalProviderService: ExternalIdentityProviderService
  ) {
    this.updateTenantLogoFormGroup = this._formBuilder.group({
      tenantLogoUrl: ['', Validators.required],
    });
  }

  onRowClick(index: number) {
    console.log('clicked on row: ', index);
    this.externalProviderService
      .get(this.data.tenantId, this.dataSource[index].id)
      .subscribe(externalProviderResponse => {
        console.log('provider', externalProviderResponse);
        const dialogRef = this.dialog.open(UpdateExternalProviderDialog, {
          data: {
            externalProviderTemplates: this.externalProviderTemplateSummaries,
            tenantId: this.data.tenantId,
            externalProvider: externalProviderResponse,
          },
        });
        dialogRef.afterClosed().subscribe(updateResult => {
          this.externalProviderService
            .update(
              updateResult.formGroup,
              this.data.tenantId,
              this.dataSource[index].id
            )
            .subscribe(result => {
              console.log('update result is: ', result);
              this.refreshDataSource();
            });
        });
      });
  }

  addProvider() {
    const dialogRef = this.dialog.open(AddExternalProviderDialog, {
      data: {
        externalProviderTemplates: this.externalProviderTemplateSummaries,
        tenantId: this.data.tenantId,
        currentProviders: this.dataSource,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.externalProviderService
          .create(result.formGroup, this.data.tenantId)
          .subscribe(result => {
            this.refreshDataSource();
          });
      }
    });
  }

  updateLogo() {
    this.loginDescriptorService
      .updateTenantLogo(this.updateTenantLogoFormGroup, this.data.tenantId)
      .subscribe(result => {
        console.log('update log response ', result);
        this.describeDescriptor();
      });
  }

  describeDescriptor() {
    this.loginDescriptorService.get(this.data.tenantId).subscribe(response => {
      this.currentLogoUrl = response.tenantLogoUrl;
      this.updateTenantLogoFormGroup.patchValue({
        tenantLogoUrl: response.tenantLogoUrl,
      });
    });
  }

  private refreshDataSource() {
    this.dataSource = [];
    this.externalProviderService
      .getAll(this.data.tenantId)
      .subscribe(providerSummaries => {
        for (let i = 0; i < providerSummaries.length; i++) {
          let summary = providerSummaries[i];
          const newRow = {
            id: summary.id,
            name: summary.name,
            iconPath: summary.iconPath,
            clientSecret: '',
            clientId: '',
          };
          this.dataSource = [...this.dataSource, newRow];
        }
      });
  }

  ngOnInit(): void {
    this.describeDescriptor();

    this.externalProviderTemplateService
      .getAvailableTemplateSummaries(this.data.tenantId)
      .subscribe(externalTemplates => {
        this.externalProviderTemplateSummaries = externalTemplates;

        for (
          let i = 0;
          i < this.externalProviderTemplateSummaries.length;
          i++
        ) {
          this.externalTemplateMapType[
            this.externalProviderTemplateSummaries[i].id
          ] = this.externalProviderTemplateSummaries[i];
        }
        this.refreshDataSource();
      });
  }
}
