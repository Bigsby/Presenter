using BL.Library;
using System.Windows;

namespace WPFApp
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        BLClass _bl;
        public MainWindow()
        {
            InitializeComponent();
            _bl = new BLClass();

            DataContext = _bl.ViewModel;
        }
    }
}
