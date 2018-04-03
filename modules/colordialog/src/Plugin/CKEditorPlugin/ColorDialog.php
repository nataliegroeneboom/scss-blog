<?php

namespace Drupal\colordialog\Plugin\CKEditorPlugin;

use Drupal\ckeditor\CKEditorPluginBase;
use Drupal\editor\Entity\Editor;

/**
 * Defines the "colordialog" plugin.
 *
 * @CKEditorPlugin(
 *   id = "colordialog",
 *   label = @Translation("CKEditor Color Dialog"),
 * )
 */
class ColorDialog extends CKEditorPluginBase {

  /**
   * {@inheritdoc}
   */
  public function getFile() {
    $path = '/libraries/colordialog/plugin.js';
    if (\Drupal::moduleHandler()->moduleExists('libraries')) {
      $path = libraries_get_path('colordialog', TRUE) . '/plugin.js';
    }
    return $path;
  }

  /**
   * {@inheritdoc}
   */
  public function getConfig(Editor $editor) {
    return [];
  }

  /**
   * {@inheritdoc}
   */
  public function getButtons() {
    return [];
  }

}
